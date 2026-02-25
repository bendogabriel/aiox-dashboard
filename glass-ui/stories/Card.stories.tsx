import type { Meta, StoryObj } from "@storybook/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../src/components/ui/card"
import { Button } from "../src/components/ui/button"
import { Input } from "../src/components/ui/input"
import { Badge } from "../src/components/ui/badge"

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some text explaining the purpose of this card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px] p-6">
      <p>A simple card with just content and no header or footer.</p>
    </Card>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feature</CardTitle>
          <Badge variant="success">New</Badge>
        </div>
        <CardDescription>This feature is brand new.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Check out this exciting new feature we just launched!</p>
      </CardContent>
    </Card>
  ),
}

export const LoginForm: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" placeholder="m@example.com" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input id="password" type="password" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost">Forgot password?</Button>
        <Button>Sign in</Button>
      </CardFooter>
    </Card>
  ),
}

export const Stats: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card className="w-[180px] p-6">
        <p className="text-sm text-muted-foreground">Total Users</p>
        <p className="text-3xl font-bold mt-2">12,345</p>
        <p className="text-xs text-green-500 mt-1">+12% from last month</p>
      </Card>
      <Card className="w-[180px] p-6">
        <p className="text-sm text-muted-foreground">Revenue</p>
        <p className="text-3xl font-bold mt-2">$45.2K</p>
        <p className="text-xs text-green-500 mt-1">+8% from last month</p>
      </Card>
      <Card className="w-[180px] p-6">
        <p className="text-sm text-muted-foreground">Active Now</p>
        <p className="text-3xl font-bold mt-2">573</p>
        <p className="text-xs text-red-500 mt-1">-3% from last hour</p>
      </Card>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer">
      <CardHeader>
        <CardTitle>Hover me!</CardTitle>
        <CardDescription>Notice the lift effect on hover.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card demonstrates the glass hover animation with elevation change.</p>
      </CardContent>
    </Card>
  ),
}
