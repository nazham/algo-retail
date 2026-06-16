import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { Button } from '@repo/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/ui/accordion';
import { Badge } from '@repo/ui/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ShoppingCart,
  Store,
  Users,
  Box,
  TrendingUp,
} from 'lucide-react';
import { DashboardPreview } from '@/components/dashboard-preview';
import { formatCurrency } from '@/lib/utils';
import { ModeToggle } from '@repo/ui/components/mode-toggle';

export const metadata: Metadata = {
  title: 'Algo Retail | The Digital Operating System for Sri Lankan Retail',
  description:
    'Empowering small businesses to step into the digital age. Unified POS, Inventory, and Customer Management designed for the local Sri Lankan market.',
};

export default async function Home() {
  // Check if user is already registered and signed in
  const cookieStore = await cookies();
  const sessionTokenNames = [
    'better-auth.session_token',
    '__Secure-better-auth.session_token',
    'session_token',
  ];
  const hasSession = sessionTokenNames.some((name) => cookieStore.get(name));

  // If signed in already, redirect straight to dashboard
  if (hasSession) {
    redirect('/dashboard');
  }

  // Calculate formatted currency for the Pro plan
  const proPrice = formatCurrency(1500000); // 15,000.00 Rupees

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <div className="bg-primary rounded-lg p-1.5 mr-2">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Algo Retail</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-6">
          <Link
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
            href="#industries"
          >
            Industries
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
            href="#pricing"
          >
            Pricing
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
            href="#faq"
          >
            FAQ
          </Link>
        </nav>
        <div className="ml-auto md:ml-6 flex items-center gap-4">
          <ModeToggle />
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden border-b border-border bg-background">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-15"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center text-center space-y-8">
              <Badge
                variant="outline"
                className="px-4 py-1 text-sm border-primary/20 bg-primary/10 text-primary"
              >
                🚀 Now Live in Sri Lanka
              </Badge>
              <div className="space-y-4 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-balance text-foreground">
                  The Digital Operating System for{' '}
                  <span className="text-primary">Sri Lankan Retail</span>
                </h1>
                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl leading-relaxed text-balance text-center">
                  Empowering small businesses to step into the digital age. Unified POS, Inventory,
                  and Customer Management designed for the local market.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm mx-auto">
                <Link href="/signup" className="w-full">
                  <Button size="lg" className="w-full h-12 text-base">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base bg-transparent"
                  >
                    Book a Demo
                  </Button>
                </Link>
              </div>
              <div className="pt-12 w-full flex justify-center">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full py-12 border-b border-border bg-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Trusted by growing businesses across Sri Lanka
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500 text-muted-foreground">
              {['City Mart', 'Lanka Fashion', 'Green Grocers', 'Tech Zone', 'Style Hub'].map(
                (brand) => (
                  <div key={brand} className="text-xl font-bold flex items-center gap-2">
                    <div className="h-8 w-8 bg-current rounded-full opacity-20"></div>
                    {brand}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="w-full py-24 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <Badge variant="secondary" className="px-4 py-1">
                Core Capabilities
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                Everything You Need to Run Your Store
              </h2>
              <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed">
                Powerful features wrapped in a simple, intuitive interface designed for modern
                retail workflows.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* Feature 1 */}
              <Card className="md:col-span-2 bg-gradient-to-br from-background to-muted/30 border-primary/10 py-4">
                <CardHeader>
                  <div className="p-2 w-fit rounded-lg bg-primary/10 mb-4">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Lightning Fast POS</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Process transactions in seconds. Support for barcode scanning, touch interface,
                    split payments, and held orders. Works offline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative h-[200px] overflow-hidden">
                  <div className="absolute right-0 bottom-0 w-[80%] h-[90%] bg-card border border-border rounded-tl-xl shadow-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-4 w-8 bg-primary/20 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-2 bg-muted/30 rounded"
                        >
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-muted rounded"></div>
                            <div className="space-y-1">
                              <div className="h-2 w-16 bg-muted-foreground/20 rounded"></div>
                              <div className="h-2 w-10 bg-muted-foreground/20 rounded"></div>
                            </div>
                          </div>
                          <div className="h-4 w-8 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="bg-background border-primary/10 py-4">
                <CardHeader>
                  <div className="p-2 w-fit rounded-lg bg-blue-500/10 mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-foreground">Real-time Analytics</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Know your best sellers, peak hours, and customer preferences instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px] w-full bg-muted/20 rounded-lg flex items-end justify-between p-4 gap-2">
                    {[40, 70, 50, 90, 60, 80].map((h, i) => (
                      <div
                        key={i}
                        className="w-full bg-blue-500/80 rounded-t"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="bg-background border-primary/10 py-4">
                <CardHeader>
                  <div className="p-2 w-fit rounded-lg bg-green-500/10 mb-4">
                    <Box className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-foreground">Smart Inventory</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Auto-reorder points, batch tracking, and multi-store stock management.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">Low Stock Alert</span>
                      <Badge variant="destructive">3 Items</Badge>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[70%]"></div>
                    </div>
                    <div className="text-xs text-muted-foreground">70% Capacity</div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="md:col-span-2 bg-gradient-to-br from-muted/30 to-background border-primary/10 py-4">
                <CardHeader>
                  <div className="p-2 w-fit rounded-lg bg-purple-500/10 mb-4">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Customer Loyalty & CRM</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Built-in loyalty program. Track purchase history, offer points, and send
                    targeted promotions to keep them coming back.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">Total Customers</div>
                    <div className="text-2xl font-bold text-foreground">1,245</div>
                    <div className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +12% this month
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">Loyalty Points</div>
                    <div className="text-2xl font-bold text-purple-600">85.4k</div>
                    <div className="text-xs text-muted-foreground mt-1">Redeemable value</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Industries Tabs */}
        <section id="industries" className="w-full py-24 bg-muted/20 border-y border-border">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 text-foreground">
                Tailored for Your Industry
              </h2>
              <p className="text-muted-foreground max-w-[700px] mx-auto">
                One platform, multiple configurations. Select your business type to see how Algo
                Retail adapts.
              </p>
            </div>

            <Tabs defaultValue="retail" className="w-full max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted border border-border">
                <TabsTrigger value="retail" className="py-3 text-sm md:text-base">
                  Fashion & Retail
                </TabsTrigger>
                <TabsTrigger value="grocery" className="py-3 text-sm md:text-base">
                  Grocery & Super
                </TabsTrigger>
                <TabsTrigger value="pharmacy" className="py-3 text-sm md:text-base">
                  Pharmacy
                </TabsTrigger>
                <TabsTrigger value="electronics" className="py-3 text-sm md:text-base">
                  Electronics
                </TabsTrigger>
              </TabsList>
              <div className="mt-8 min-h-[300px]">
                <TabsContent value="retail" className="space-y-4">
                  <Card className="py-4">
                    <CardHeader>
                      <CardTitle className="text-foreground">Fashion & Apparel</CardTitle>
                      <CardDescription>
                        Handle variants like size, color, and style with ease.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">
                              Product Variants (Size/Color Matrix)
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Barcode Label Printing</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Exchange & Return Management</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Gift Cards & Store Credit</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-muted rounded-lg p-4 flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="font-bold text-lg mb-2 text-foreground">
                            Variant Matrix
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div className="p-2 border border-border bg-background rounded text-foreground">
                              S
                            </div>
                            <div className="p-2 border border-border bg-background rounded text-foreground">
                              M
                            </div>
                            <div className="p-2 border border-border bg-background rounded text-foreground">
                              L
                            </div>
                            <div className="p-2 border border-border bg-background rounded text-foreground">
                              XL
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="grocery" className="space-y-4">
                  <Card className="py-4">
                    <CardHeader>
                      <CardTitle className="text-foreground">Grocery & Supermarket</CardTitle>
                      <CardDescription>
                        High-speed checkout with scale integration and expiry tracking.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Weight Scale Integration</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Expiry Date Tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Price Embedded Barcodes</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Quick Cash Keys</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-muted rounded-lg p-4 flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="font-bold text-lg mb-2 text-foreground">
                            Fresh Produce
                          </div>
                          <Badge variant="warning">Expiring Soon</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pharmacy" className="space-y-4">
                  <Card className="py-4">
                    <CardHeader>
                      <CardTitle className="text-foreground">Pharmacy & Health</CardTitle>
                      <CardDescription>
                        Safety compliance and batch tracking for medications.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Batch & Lot Tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Prescription Management</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Generic Substitutes</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Restricted Items Control</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-muted rounded-lg p-4 flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="font-bold text-lg mb-2 text-foreground">Batch #892A</div>
                          <div className="text-sm text-muted-foreground">Expires: Dec 2025</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="electronics" className="space-y-4">
                  <Card className="py-4">
                    <CardHeader>
                      <CardTitle className="text-foreground">Electronics & Gadgets</CardTitle>
                      <CardDescription>
                        Track serial numbers and warranties effortlessly.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Serial Number Tracking (IMEI)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Warranty Management</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Repair Service Tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-foreground">Bundle Deals</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-muted rounded-lg p-4 flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="font-bold text-lg mb-2 text-foreground">
                            Warranty Check
                          </div>
                          <div className="text-sm font-mono bg-background px-2 py-1 rounded border border-border text-foreground">
                            SN: 7823-9982
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-24 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 text-foreground">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground max-w-[700px] mx-auto">
                Start for free and scale as you grow. No hidden fees.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto items-stretch">
              <Card className="flex flex-col py-4">
                <CardHeader>
                  <CardTitle className="text-foreground">Starter</CardTitle>
                  <CardDescription>For small pop-ups and side hustles</CardDescription>
                  <div className="text-4xl font-bold mt-4 text-foreground">Free</div>
                  <div className="text-sm text-muted-foreground mt-1">Forever</div>
                </CardHeader>
                <CardContent className="flex-1 mt-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> 1 Register
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> 100 Products
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Basic Reports
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Email Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Link href="/signup" className="w-full">
                    <Button variant="outline" className="w-full bg-transparent">
                      Get Started
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="flex flex-col border-primary relative shadow-lg scale-100 md:scale-105 z-10 py-4">
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="px-3 py-1 bg-primary text-primary-foreground border-none">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground">Pro</CardTitle>
                  <CardDescription>For growing retail businesses</CardDescription>
                  <div className="text-4xl font-bold mt-4 text-foreground">
                    {proPrice}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 mt-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> 3 Registers
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Products
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Advanced Analytics
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Loyalty Program
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Multi-store (up to 3)
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Link href="/signup" className="w-full">
                    <Button className="w-full">Start Free Trial</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="flex flex-col py-4">
                <CardHeader>
                  <CardTitle className="text-foreground">Enterprise</CardTitle>
                  <CardDescription>For chains and franchises</CardDescription>
                  <div className="text-4xl font-bold mt-4 text-foreground">Custom</div>
                  <div className="text-sm text-muted-foreground mt-1">Tailored package</div>
                </CardHeader>
                <CardContent className="flex-1 mt-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Registers
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Dedicated Support
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Custom Integrations
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> API Access
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> SLA Guarantee
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Link href="#contact" className="w-full">
                    <Button variant="outline" className="w-full bg-transparent">
                      Contact Sales
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-24 bg-muted/20 border-t border-border">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter mb-4 text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion
              type="single"
              collapsible
              className="w-full bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-foreground font-semibold">
                  Do I need special hardware?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No! Algo Retail works on any device with a web browser - iPad, Android tablet,
                  laptop, or desktop. We also support standard USB barcode scanners and receipt
                  printers.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-foreground font-semibold">
                  Can I use it offline?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, our POS has an offline mode that lets you continue selling even if your
                  internet goes down. Data syncs automatically when you reconnect.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-foreground font-semibold">
                  Is my data secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely. We use enterprise-grade encryption for all data and process payments
                  through secure, PCI compliant local and global partners.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-foreground font-semibold">
                  Can I migrate my existing data?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, we offer easy CSV import tools for products and customers. Our support team
                  can also assist with migrating from other major POS systems.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to transform your retail business?
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Join thousands of retailers who are saving time and increasing sales with Algo
                Retail.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 max-w-sm mx-auto">
                <Link href="/signup" className="w-full">
                  <Button size="lg" variant="secondary" className="w-full h-12">
                    Start Your Free Trial
                  </Button>
                </Link>
                <Link href="#contact" className="w-full">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Talk to Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-background border-t border-border">
        <div className="container px-4 md:px-6 mx-auto grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-1.5">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">Algo Retail</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The all-in-one retail operating system designed for the modern merchant.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#features">Features</Link>
              </li>
              <li>
                <Link href="#pricing">Pricing</Link>
              </li>
              <li>
                <Link href="#industries">Industries</Link>
              </li>
              <li>
                <Link href="#">Changelog</Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#">About Us</Link>
              </li>
              <li>
                <Link href="#">Careers</Link>
              </li>
              <li>
                <Link href="#">Blog</Link>
              </li>
              <li>
                <Link href="#">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#">Privacy Policy</Link>
              </li>
              <li>
                <Link href="#">Terms of Service</Link>
              </li>
              <li>
                <Link href="#">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="container px-4 md:px-6 mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2026 Algo Retail Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
