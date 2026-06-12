import React, { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, inputClassName } from "@/components/ui/FormField";

export type LocalizedString = string | Record<string, string>;

export type ConfigOption = {
  key: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  type: string;
  values?: string[] | null;
  current_value?: string | number | null;
};

type ConfigOptionFormProps = {
  options: ConfigOption[];
  onSubmit: (values: Record<string, string>) => void;
  submitLabel: string;
};

function currentLocale(): string {
  return document.documentElement.lang || "en";
}

function localizedValue(value: LocalizedString | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;

  return value[currentLocale()] ?? Object.values(value)[0] ?? null;
}

function currentValue(option: ConfigOption): string {
  if (option.current_value == null) return "";

  return String(option.current_value);
}

function optionCategory(option: ConfigOption) {
  return option.key.split(/[._]/)[0] || "Configuration";
}

export default function ConfigOptionForm({
  options,
  onSubmit,
  submitLabel,
}: ConfigOptionFormProps) {
  const visibleOptions = options.filter((option) => option.type !== "Hash");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(
      options
        .filter((option) => option.type !== "Hash")
        .reduce<Record<string, string>>((result, option) => {
          result[option.key] = currentValue(option);
          return result;
        }, {}),
    );
  }, [options]);

  function updateValue(key: string, value: string) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {Object.entries(
          visibleOptions.reduce<Record<string, ConfigOption[]>>((groups, option) => {
            const category = optionCategory(option);
            groups[category] = groups[category] || [];
            groups[category].push(option);
            return groups;
          }, {}),
        ).map(([category, categoryOptions]) => (
          <Card key={category}>
            <CardHeader>{category}</CardHeader>
            <CardBody>
              {categoryOptions.map((option) => {
                const label = localizedValue(option.name) ?? option.key;
                const description = localizedValue(option.description);

                return (
                  <FormField key={option.key} label={label}>
                    {description ? <p className="mb-2 text-sm text-gray-500">{description}</p> : null}
                    {option.values ? (
                      <select
                        className={inputClassName}
                        id={`config_${option.key}`}
                        name={`config[${option.key}]`}
                        value={values[option.key] ?? ""}
                        onChange={(event) => updateValue(option.key, event.target.value)}
                      >
                        {option.values.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={inputClassName}
                        id={`config_${option.key}`}
                        name={`config[${option.key}]`}
                        type="text"
                        value={values[option.key] ?? ""}
                        onChange={(event) => updateValue(option.key, event.target.value)}
                      />
                    )}
                  </FormField>
                );
              })}
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
