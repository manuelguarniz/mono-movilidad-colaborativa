import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import {
  SEAT_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type VehicleFormValues,
} from "@/features/vehicles/utils/vehicleForm";
import CalendarIcon from "@/assets/images/icons/calendar.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import PaletteIcon from "@/assets/images/icons/palette.svg?react";

type VehicleFieldsProps = {
  values: VehicleFormValues;
  onChange: (field: keyof VehicleFormValues, value: string) => void;
};

/** Campos del vehículo que comparten el registro y la actualización (RF-08, RF-22). */
export function VehicleFields({ values, onChange }: VehicleFieldsProps) {
  return (
    <>
      <AuthField
        label="Placa"
        value={values.plate}
        placeholder="Ej: ABC-123"
        maxLength={8}
        autoComplete="off"
        onChange={(value) => onChange("plate", value.toUpperCase())}
        icon={<IdCardIcon className="h-6 w-6" />}
      />

      <AuthSelectField
        label="Tipo de vehículo"
        value={values.type}
        placeholder="Seleccione un tipo"
        options={VEHICLE_TYPE_OPTIONS}
        onChange={(value) => onChange("type", value)}
        icon={<CarIcon className="h-6 w-6" />}
      />

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          label="Marca"
          value={values.brand}
          placeholder="Ej: Toyota"
          maxLength={40}
          onChange={(value) => onChange("brand", value)}
        />
        <AuthField
          label="Modelo"
          value={values.model}
          placeholder="Ej: Yaris"
          maxLength={40}
          onChange={(value) => onChange("model", value)}
        />
      </div>

      <AuthField
        label="Color"
        value={values.color}
        placeholder="Ej: Blanco"
        maxLength={30}
        onChange={(value) => onChange("color", value)}
        icon={<PaletteIcon className="h-6 w-6" />}
      />

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          label="Año de fabricación"
          value={values.year}
          placeholder="Ej: 2020"
          inputMode="numeric"
          maxLength={4}
          onChange={(value) => onChange("year", value.replace(/\D/g, ""))}
          icon={<CalendarIcon className="h-6 w-6" />}
        />
        <AuthSelectField
          label="Plazas"
          value={values.seats}
          placeholder="Elige"
          options={SEAT_OPTIONS}
          onChange={(value) => onChange("seats", value)}
        />
      </div>
    </>
  );
}
