import type { Meta, StoryObj } from "@storybook/react"
import { Textarea } from "../src/components/ui/textarea"
import { Button } from "../src/components/ui/button"

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: "This is some default text in the textarea. It can span multiple lines and demonstrates how content looks inside the glass-styled component.",
  },
}

export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[400px]">
      <label htmlFor="message" className="text-sm font-medium">
        Your Message
      </label>
      <Textarea
        id="message"
        placeholder="Write your message here..."
      />
      <p className="text-xs text-muted-foreground">
        Your message will be sent to our support team.
      </p>
    </div>
  ),
}

export const WithCharCount: Story = {
  render: () => {
    const maxLength = 280
    return (
      <div className="flex flex-col gap-2 w-[400px]">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          maxLength={maxLength}
        />
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">0/{maxLength}</span>
        </div>
      </div>
    )
  },
}

export const Resizable: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[400px]">
      <label htmlFor="notes" className="text-sm font-medium">
        Notes
      </label>
      <Textarea
        id="notes"
        placeholder="Add your notes..."
        className="resize-y min-h-[100px]"
      />
    </div>
  ),
}

export const ContactForm: Story = {
  render: () => (
    <form className="flex flex-col gap-4 w-[400px]">
      <div className="flex flex-col gap-2">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          placeholder="What is this about?"
          className="flex h-10 w-full rounded-xl px-4 py-2 text-sm bg-[var(--glass-bg-input)] backdrop-blur-md border border-[var(--glass-border-color)] shadow-[var(--glass-shadow)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="contact-message"
          placeholder="Describe your issue or question in detail..."
          className="min-h-[150px]"
        />
      </div>
      <Button type="submit" className="self-end">
        Send Message
      </Button>
    </form>
  ),
}

export const CodeInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-[500px]">
      <label htmlFor="code" className="text-sm font-medium">
        Code Snippet
      </label>
      <Textarea
        id="code"
        placeholder="Paste your code here..."
        className="font-mono text-xs min-h-[200px]"
        defaultValue={`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`}
      />
    </div>
  ),
}
