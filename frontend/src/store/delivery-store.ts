"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PackageDetails,
  PackageType,
  ServiceType,
} from "@/types";
import { buildQuoteLocally, type LocalQuote } from "@/lib/pricing";

/* -------------------------------------------------------------------------- */
/*                          Delivery wizard store                            */
/* -------------------------------------------------------------------------- */

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const WIZARD_STEPS = [
  { step: 1 as WizardStep, key: "location", title: "Location", short: "Location" },
  { step: 2 as WizardStep, key: "package", title: "Package", short: "Package" },
  { step: 3 as WizardStep, key: "service", title: "Service", short: "Service" },
  { step: 4 as WizardStep, key: "review", title: "Review", short: "Review" },
  { step: 5 as WizardStep, key: "payment", title: "Payment", short: "Payment" },
  { step: 6 as WizardStep, key: "confirmation", title: "Confirmation", short: "Done" },
] as const;

export interface DraftAddress {
  id?: string;
  label: string;
  recipientName?: string;
  contactNumber?: string;
  addressLine: string;
  city: string;
  province?: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  deliveryInstructions?: string;
}

export interface DeliveryDraft {
  pickup: DraftAddress | null;
  destination: DraftAddress | null;
  package: PackageDetails;
  serviceType: ServiceType;
  scheduledFor: string | null;
  courierInstructions: string;
  couponCode: string | null;
  discount: number;
}

export const EMPTY_PACKAGE: PackageDetails = {
  type: "SMALL_PARCEL",
  weight: 1,
  length: 20,
  width: 15,
  height: 10,
  quantity: 1,
  isFragile: false,
  isTemperatureSensitive: false,
  requiresSpecialHandling: false,
  description: "",
  specialInstructions: "",
};

const EMPTY_DRAFT: DeliveryDraft = {
  pickup: null,
  destination: null,
  package: { ...EMPTY_PACKAGE },
  serviceType: "INSTANT",
  scheduledFor: null,
  courierInstructions: "",
  couponCode: null,
  discount: 0,
};

interface DeliveryWizardState {
  step: WizardStep;
  maxReached: WizardStep;
  draft: DeliveryDraft;
  /** Ids of server-side resources created during the flow. */
  deliveryId: string | null;
  orderRef: string | null;
  paymentId: string | null;
  transactionId: string | null;
  idempotencyKey: string | null;

  setStep: (step: WizardStep) => void;
  next: () => void;
  back: () => void;
  setPickup: (address: DraftAddress | null) => void;
  setDestination: (address: DraftAddress | null) => void;
  patchPackage: (patch: Partial<PackageDetails>) => void;
  setServiceType: (service: ServiceType) => void;
  setScheduledFor: (iso: string | null) => void;
  setCourierInstructions: (value: string) => void;
  setCoupon: (code: string | null, discount: number) => void;
  setOrder: (payload: { deliveryId: string; orderRef: string }) => void;
  setPayment: (payload: { paymentId: string; transactionId?: string | null }) => void;
  setIdempotencyKey: (key: string) => void;
  patchDraft: (patch: Partial<DeliveryDraft>) => void;
  reset: () => void;
  resetFromStep: (step: WizardStep) => void;
}

export const useDeliveryWizardStore = create<DeliveryWizardState>()(
  persist(
    (set, get) => ({
      step: 1,
      maxReached: 1,
      draft: { ...EMPTY_DRAFT },
      deliveryId: null,
      orderRef: null,
      paymentId: null,
      transactionId: null,
      idempotencyKey: null,

      setStep: (step) => set({ step }),
      next: () =>
        set((s) => ({
          step: Math.min(6, s.step + 1) as WizardStep,
          maxReached: Math.max(s.maxReached, Math.min(6, s.step + 1)) as WizardStep,
        })),
      back: () => set((s) => ({ step: Math.max(1, s.step - 1) as WizardStep })),

      setPickup: (pickup) => set((s) => ({ draft: { ...s.draft, pickup } })),
      setDestination: (destination) => set((s) => ({ draft: { ...s.draft, destination } })),
      patchPackage: (patch) => set((s) => ({ draft: { ...s.draft, package: { ...s.draft.package, ...patch } } })),
      setServiceType: (serviceType) => set((s) => ({ draft: { ...s.draft, serviceType } })),
      setScheduledFor: (scheduledFor) => set((s) => ({ draft: { ...s.draft, scheduledFor } })),
      setCourierInstructions: (courierInstructions) =>
        set((s) => ({ draft: { ...s.draft, courierInstructions } })),
      setCoupon: (couponCode, discount) =>
        set((s) => ({ draft: { ...s.draft, couponCode, discount } })),
      patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      setOrder: ({ deliveryId, orderRef }) => set({ deliveryId, orderRef }),
      setPayment: ({ paymentId, transactionId }) =>
        set((s) => ({ paymentId, transactionId: transactionId ?? s.transactionId })),
      setIdempotencyKey: (idempotencyKey) => set({ idempotencyKey }),

      reset: () =>
        set({
          step: 1,
          maxReached: 1,
          draft: { ...EMPTY_DRAFT },
          deliveryId: null,
          orderRef: null,
          paymentId: null,
          transactionId: null,
          idempotencyKey: null,
        }),

      resetFromStep: (step) => {
        const state = get();
        if (step <= 2) {
          set({
            step,
            deliveryId: null,
            orderRef: null,
            paymentId: null,
            transactionId: null,
            draft: { ...EMPTY_DRAFT },
          });
          return;
        }
        set({ step, paymentId: null, transactionId: null });
      },
    }),
    {
      name: "grx-delivery-wizard",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        step: s.step,
        maxReached: s.maxReached,
        draft: s.draft,
        deliveryId: s.deliveryId,
        orderRef: s.orderRef,
        paymentId: s.paymentId,
        transactionId: s.transactionId,
        idempotencyKey: s.idempotencyKey,
      }),
    },
  ),
);

/* -------------------------------------------------------------------------- */
/*                          Notification toast state                          */
/* -------------------------------------------------------------------------- */

export interface LiveToast {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  href?: string;
}

interface RealtimeToastState {
  toasts: LiveToast[];
  push: (toast: Omit<LiveToast, "id">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useRealtimeToastStore = create<RealtimeToastState>()((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({
      toasts: [...s.toasts.slice(-3), { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/* -------------------------------------------------------------------------- */
/*                              Tracking state                                */
/* -------------------------------------------------------------------------- */

interface LiveTrackingState {
  deliveryId: string | null;
  courierLocation: { latitude: number; longitude: number } | null;
  progressPercent: number;
  etaMinutes: number | null;
  isConnected: boolean;
  lastEventAt: string | null;
  begin: (deliveryId: string) => void;
  setCourierLocation: (loc: { latitude: number; longitude: number } | null) => void;
  setProgress: (pct: number) => void;
  setEta: (eta: number | null) => void;
  setConnected: (connected: boolean) => void;
  touch: () => void;
  end: () => void;
}

export const useTrackingStore = create<LiveTrackingState>()((set) => ({
  deliveryId: null,
  courierLocation: null,
  progressPercent: 0,
  etaMinutes: null,
  isConnected: false,
  lastEventAt: null,
  begin: (deliveryId) => set({ deliveryId, courierLocation: null, progressPercent: 0, etaMinutes: null }),
  setCourierLocation: (courierLocation) => set({ courierLocation }),
  setProgress: (progressPercent) => set({ progressPercent }),
  setEta: (etaMinutes) => set({ etaMinutes }),
  setConnected: (isConnected) => set({ isConnected }),
  touch: () => set({ lastEventAt: new Date().toISOString() }),
  end: () =>
    set({
      deliveryId: null,
      courierLocation: null,
      progressPercent: 0,
      etaMinutes: null,
      isConnected: false,
    }),
}));

export type { PackageType, LocalQuote };
export { buildQuoteLocally };
