import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "../src/components/ui/input"
import { Button } from "../src/components/ui/button"
import { Search } from "lucide-react"

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
}

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
}

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
}

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: "Hello Glass UI!",
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <Input id="email" type="email" placeholder="email@example.com" />
    </div>
  ),
}

export const WithIconLeft: Story = {
  render: () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input className="pl-10" placeholder="Search..." />
    </div>
  ),
}

export const WithButton: Story = {
  render: () => (
    <div className="flex gap-2">
      <Input type="email" placeholder="Enter your email" />
      <Button>Subscribe</Button>
    </div>
  ),
}

export const File: Story = {
  args: {
    type: "file",
  },
}

export const FormExample: Story = {
  render: () => (
    <form className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="form-email" className="text-sm font-medium">
          Email
        </label>
        <Input id="form-email" type="email" placeholder="john@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>
      <Button type="submit">Sign Up</Button>
    </form>
  ),
}
