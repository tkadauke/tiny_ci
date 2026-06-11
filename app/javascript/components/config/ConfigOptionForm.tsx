import React, { FormEvent, useEffect, useState } from "react";

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
      {visibleOptions.map((option) => {
        const label = localizedValue(option.name) ?? option.key;
        const description = localizedValue(option.description);

        return (
          <p className="form_item" key={option.key}>
            <span className="label">
              <label htmlFor={`config_${option.key}`}>{label}</label>
            </span>
            {description ? <span className="desc">{description}</span> : null}
            {option.values ? (
              <select
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
                id={`config_${option.key}`}
                name={`config[${option.key}]`}
                type="text"
                value={values[option.key] ?? ""}
                onChange={(event) => updateValue(option.key, event.target.value)}
              />
            )}
          </p>
        );
      })}
      <input type="submit" value={submitLabel} />
    </form>
  );
}
