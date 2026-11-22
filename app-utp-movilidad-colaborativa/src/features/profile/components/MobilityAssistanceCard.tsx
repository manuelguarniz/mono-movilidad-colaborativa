import { useId } from "react";
import { FieldError } from "@/features/auth/components/FieldError";
import type { MobilityAssistanceType } from "@/features/profile/types";
import {
  ASSISTANCE_LABELS,
  ASSISTANCE_TYPES,
  MAX_ASSISTANCE_NOTE,
  type AssistanceErrors,
  type AssistanceForm,
} from "@/features/profile/utils/assistance";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import PassengerIcon from "@/assets/images/icons/passenger.svg?react";
import PlusCircleIcon from "@/assets/images/icons/plus-circle.svg?react";
import TrashIcon from "@/assets/images/icons/trash.svg?react";

const TYPE_ICONS: Record<MobilityAssistanceType, typeof AccessibleIcon> = {
  WHEELCHAIR: AccessibleIcon,
  CRUTCHES_OR_WALKER: PassengerIcon,
  OTHER: PlusCircleIcon,
};

type MobilityAssistanceCardProps = {
  value: AssistanceForm;
  errors: AssistanceErrors;
  onChange: (next: AssistanceForm) => void;
  /**
   * P15: apagar el interruptor o tocar «Quitar asistencia» pasa por aquí, para que la
   * pantalla pida confirmación si había una asistencia guardada (15-D). En P04 no se pasa.
   */
  onDisable?: () => void;
  // P04 (registro) o P15 (actualizar datos): cambian la nota de privacidad y el pie.
  variant: "register" | "update";
};

/** «ASISTENCIA DE MOVILIDAD (OPCIONAL)» de P04 (04-A a 04-C) y P15 (15-A a 15-C), RN-17. */
export function MobilityAssistanceCard({
  value,
  errors,
  onChange,
  onDisable,
  variant,
}: MobilityAssistanceCardProps) {
  const noteId = useId();
  const consentErrorId = useId();
  const set = (patch: Partial<AssistanceForm>) => onChange({ ...value, ...patch });
  const disable = () => (onDisable ? onDisable() : set({ enabled: false }));

  return (
    <section className="form-card" id="asistencia" aria-labelledby="assistance-title">
      <p className="form-card-label">
        <AccessibleIcon className="h-5 w-5 text-[var(--text-brown)]" aria-hidden="true" />
        Asistencia de movilidad (opcional)
      </p>

      <label className="mt-3 flex cursor-pointer items-center justify-between gap-3">
        <span id="assistance-title" className="text-base font-semibold text-[var(--text-primary)]">
          Necesito asistencia de movilidad
        </span>
        <input
          type="checkbox"
          role="switch"
          className="app-switch"
          checked={value.enabled}
          onChange={(event) => (event.target.checked ? set({ enabled: true }) : disable())}
        />
      </label>
      <p className="mt-1 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
        Si usas silla de ruedas, muletas o andador, avísalo para que el conductor se prepare. Es
        opcional.
      </p>

      {value.enabled ? (
        <>
          <p className="auth-label mb-2 mt-4 block">Tipo de asistencia</p>
          <div className="space-y-2" role="radiogroup" aria-label="Tipo de asistencia">
            {ASSISTANCE_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              const selected = value.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? "assist-option assist-option-active" : "assist-option"}
                  onClick={() => set({ type })}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{ASSISTANCE_LABELS[type]}</span>
                  {selected ? <CheckCircleIcon className="h-5 w-5" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
          {errors.type ? <FieldError>{errors.type}</FieldError> : null}

          <label htmlFor={noteId} className="auth-label mb-2 mt-4 block">
            Nota para el conductor (opcional)
          </label>
          <textarea
            id={noteId}
            rows={2}
            maxLength={MAX_ASSISTANCE_NOTE}
            className={errors.note ? "assist-note auth-input-error" : "assist-note"}
            placeholder="Ej. Silla plegable, puedo pasar al asiento solo."
            value={value.note}
            onChange={(event) => set({ note: event.target.value })}
          />
          <p className="mt-1 text-right text-xs tabular-nums text-[var(--text-muted)]">
            {value.note.length}/{MAX_ASSISTANCE_NOTE}
          </p>
          {errors.note ? <FieldError>{errors.note}</FieldError> : null}

          <label className="form-check-option mb-0 mt-3">
            <input
              type="checkbox"
              className={`app-checkbox form-checkbox${errors.consent ? " form-checkbox-error" : ""}`}
              checked={value.consent}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? consentErrorId : undefined}
              onChange={(event) => set({ consent: event.target.checked })}
            />
            <span>
              Autorizo compartir esta información con los conductores de los viajes que reserve
            </span>
          </label>
          {errors.consent ? <FieldError id={consentErrorId}>{errors.consent}</FieldError> : null}

          <p className="form-note">
            <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {variant === "register"
              ? "Es un dato sensible. Solo lo verán los conductores de tus viajes, nunca otros pasajeros. Puedes quitarlo cuando quieras desde tu perfil."
              : "Es un dato sensible. Solo lo verán los conductores de tus viajes, nunca otros pasajeros."}
          </p>

          {variant === "update" ? (
            <>
              <button
                type="button"
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-red)]"
                onClick={disable}
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                Quitar asistencia
              </button>
              <p className="form-note">
                <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Los cambios no modifican las reservas que ya hiciste.
              </p>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
