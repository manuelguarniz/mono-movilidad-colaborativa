import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import { FieldError } from "@/features/auth/components/FieldError";
import {
  MAX_SEATS,
  MIN_SEATS,
  VEHICLE_TYPE_OPTIONS,
  type VehicleFieldErrors,
  type VehicleFormValues,
} from "@/features/vehicles/utils/vehicleForm";
import CalendarIcon from "@/assets/images/icons/calendar.svg?react";
import CarIcon from "@/assets/images/icons/car.svg?react";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import PaletteIcon from "@/assets/images/icons/palette.svg?react";

type VehicleFieldsProps = {
  values: VehicleFormValues;
  errors?: VehicleFieldErrors;
  onChange: (field: keyof VehicleFormValues, value: string) => void;
};

/** «DATOS DEL VEHÍCULO» de P05 y P16 (16-A): placa, tipo, marca, modelo, color, año y asientos. */
export function VehicleFields({ values, errors = {}, onChange }: VehicleFieldsProps) {
  const seats = values.seats ? Number(values.seats) : null;
  const setSeats = (next: number) =>
    onChange("seats", String(Math.min(MAX_SEATS, Math.max(MIN_SEATS, next))));

  return (
    <>
      <p className="form-section-label">Datos del vehículo</p>

      <AuthField
        label="Placa"
        labelAction={<span className="text-xs text-[var(--text-muted)]">Formato ABC-123</span>}
        value={values.plate}
        placeholder="Ej: ABC-123"
        maxLength={8}
        autoComplete="off"
        onChange={(value) => onChange("plate", value.toUpperCase())}
        icon={<IdCardIcon className="h-6 w-6" />}
        error={errors.plate}
      />

      <AuthSelectField
        label="Tipo de vehículo"
        value={values.type}
        placeholder="Selecciona un tipo"
        options={VEHICLE_TYPE_OPTIONS}
        onChange={(value) => onChange("type", value)}
        icon={<CarIcon className="h-6 w-6" />}
        error={errors.type}
      />

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          label="Marca"
          value={values.brand}
          placeholder="Ej: Toyota"
          maxLength={40}
          onChange={(value) => onChange("brand", value)}
          icon={<CarIcon className="h-5 w-5" />}
          error={errors.brand}
        />
        <AuthField
          label="Modelo"
          value={values.model}
          placeholder="Ej: Yaris"
          maxLength={40}
          onChange={(value) => onChange("model", value)}
          icon={<CarIcon className="h-5 w-5" />}
          error={errors.model}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          label="Color"
          value={values.color}
          placeholder="Ej: Blanco"
          maxLength={30}
          onChange={(value) => onChange("color", value)}
          icon={<PaletteIcon className="h-5 w-5" />}
          error={errors.color}
        />
        <AuthField
          label="Año"
          value={values.year}
          placeholder="Ej: 2020"
          inputMode="numeric"
          maxLength={4}
          onChange={(value) => onChange("year", value.replace(/\D/g, ""))}
          icon={<CalendarIcon className="h-5 w-5" />}
          error={errors.year}
        />
      </div>

      {/* RN-09: stepper de 1 a 10 (16-A). */}
      <div className="mb-5">
        <p className="auth-label mb-2 block" id="seats-label">
          Asientos para pasajeros
        </p>
        <div
          className={errors.seats ? "seat-stepper auth-input-error" : "seat-stepper"}
          role="group"
          aria-labelledby="seats-label"
        >
          <button
            type="button"
            className="seat-stepper-button"
            aria-label="Quitar un asiento"
            disabled={seats !== null && seats <= MIN_SEATS}
            onClick={() => setSeats((seats ?? MIN_SEATS) - 1)}
          >
            −
          </button>
          <span className="text-xl font-semibold tabular-nums text-[var(--text-primary)]" aria-live="polite">
            {seats ?? "—"}
          </span>
          <button
            type="button"
            className="seat-stepper-button"
            aria-label="Agregar un asiento"
            disabled={seats !== null && seats >= MAX_SEATS}
            onClick={() => setSeats(seats === null ? MIN_SEATS : seats + 1)}
          >
            +
          </button>
        </div>
        {errors.seats ? <FieldError>{errors.seats}</FieldError> : null}
        <p className="auth-helper-text text-[0.8125rem] text-[var(--text-muted)]">
          De 1 a 10. Es el máximo que podrás ofrecer por viaje.
        </p>
      </div>
    </>
  );
}
