import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "../src/components/ui/badge"

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "secondary", "success", "warning", "error", "outline"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: "Badge",
  },
}

export const Primary: Story = {
  args: {
    children: "Primary",
    variant: "primary",
  },
}

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
}

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
}

export const Warning: Story = {
  args: {
    children: "Warning",
    variant: "warning",
  },
}

export const Error: Story = {
  args: {
    children: "Error",
    variant: "error",
  },
}

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const StatusIndicators: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="success">Online</Badge>
        <span className="text-sm">User is currently active</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">Away</Badge>
        <span className="text-sm">User is away from keyboard</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="error">Offline</Badge>
        <span className="text-sm">User is not connected</span>
      </div>
    </div>
  ),
}

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary">v1.0.0</Badge>
      <Badge variant="secondary">TypeScript</Badge>
      <Badge variant="success">Stable</Badge>
      <Badge variant="warning">Beta</Badge>
      <Badge variant="error">Deprecated</Badge>
    </div>
  ),
}
