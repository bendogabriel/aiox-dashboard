import type { Meta, StoryObj } from "@storybook/react"
import { Toaster, toast } from "../src/components/ui/toast"
import { Button } from "../src/components/ui/button"

const meta: Meta<typeof Toaster> = {
  title: "Components/Toast",
  component: Toaster,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast("This is a toast message")}>
      Show Toast
    </Button>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2024 at 9:00 AM",
        })
      }
    >
      Show Toast
    </Button>
  ),
}

export const Success: Story = {
  render: () => (
    <Button
      variant="secondary"
      onClick={() =>
        toast.success("Success!", {
          description: "Your changes have been saved.",
        })
      }
    >
      Show Success Toast
    </Button>
  ),
}

export const Error: Story = {
  render: () => (
    <Button
      variant="destructive"
      onClick={() =>
        toast.error("Error!", {
          description: "Something went wrong. Please try again.",
        })
      }
    >
      Show Error Toast
    </Button>
  ),
}

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.warning("Warning!", {
          description: "Your session is about to expire.",
        })
      }
    >
      Show Warning Toast
    </Button>
  ),
}

export const Info: Story = {
  render: () => (
    <Button
      variant="ghost"
      onClick={() =>
        toast.info("Info", {
          description: "A new version is available.",
        })
      }
    >
      Show Info Toast
    </Button>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("File deleted", {
          description: "document.pdf has been removed.",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo clicked"),
          },
        })
      }
    >
      Delete File
    </Button>
  ),
}

export const AsyncPromise: Story = {
  render: () => (
    <Button
      onClick={() => {
        const asyncOp = new window.Promise<void>((resolve) => setTimeout(resolve, 2000))
        toast.promise(asyncOp, {
          loading: "Loading...",
          success: "Data loaded successfully!",
          error: "Error loading data",
        })
      }}
    >
      Load Data
    </Button>
  ),
}

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast("Default toast")}>
        Default
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.success("Success toast")}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.error("Error toast")}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.warning("Warning toast")}
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.info("Info toast")}
      >
        Info
      </Button>
    </div>
  ),
}
