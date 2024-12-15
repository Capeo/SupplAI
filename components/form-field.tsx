interface FormFieldProps {
  label: string;
  description: string;
  id: string;
  type?: string;
  placeholder?: string;
  value?: string;
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

import { Input } from "@/components/ui/input";

export function FormField({
  label,
  description,
  id,
  type = "text",
  placeholder,
  value,
  accept,
  onChange
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        accept={accept}
        onChange={onChange}
      />
      <p className="text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
} 