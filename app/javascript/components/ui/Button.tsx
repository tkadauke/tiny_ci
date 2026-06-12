import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"
type ButtonSize = "sm" | "md"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md text-sm",
  secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded-md text-sm",
  danger: "bg-red-600 hover:bg-red-500 text-white font-medium rounded-md text-sm",
  ghost: "text-blue-600 hover:text-blue-500 text-sm underline-offset-2 hover:underline",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
}

export function Button({ children, className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  const padding = variant === "ghost" ? "" : sizeStyles[size]

  return (
    <button className={`${variantStyles[variant]} ${padding} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
