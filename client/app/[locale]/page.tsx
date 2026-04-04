"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSessionUser, resolveAccountType } from "@/lib/authClient";
import Logo from "@/components/ui/logo";
import { 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Star, 
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Award,
  CheckCircle,
  Smartphone,
  Target,
  AlertCircle,
  ChevronRight,
  DollarSign,
  TrendingDown
} from "lucide-react";

const HomePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [notificationIndex, setNotificationIndex] = useState(0);

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: "New Opportunity!",
      message: "₹2,000 - Plumber needed in Bilimora",
      type: "job",
      icon: "🔧"
    },
    {
      id: 2,
      title: "Payment Received",
      message: "₹5,500 credited to your account",
      type: "payment",
      icon: "💳"
    },
    {
      id: 3,
      title: "New Rating",
      message: "5.0★ - Great work! Excellent services",
      type: "rating",
      icon: "⭐"
    },
    {
      id: 4,
      title: "Job Near You",
      message: "Interior painting - 1.2 km away - ₹1,500",
      type: "job",
      icon: "🎨"
    }
  ];

  useEffect(() => {
    const hydrateSession = async () => {
      const sessionUser = await fetchSessionUser();
      setUser(sessionUser || null);
      setSessionChecked(true);
    };

    void hydrateSession();
  }, []);

  // Auto-rotate notifications
  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setNotificationIndex((prev) => (prev + 1) % notifications.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  if (!sessionChecked) {
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Logo size={80} showText={true} />
        <p className="mt-4 text-purple-600 animate-pulse">Loading...</p>
      </div>
    );
  }

  const locale = params.locale as string || "en";
  const accountType = resolveAccountType(user);
  const isContractor = accountType === "contractor";

  // Hero Section
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      {/* ========== NOTIFICATION CAROUSEL BANNER ========== */}
      <div className="relative w-full bg-gradient-to-r from-secondary/10 via-secondary/5 to-accent/10 border-b border-secondary/20 px-4 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative h-20 md:h-24 flex items-center">
            {/* Notification Cards Carousel */}
            <div className="relative w-full overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(calc(-${notificationIndex * 100}%))`
                }}
              >
                {notifications.map((notif, idx) => (
                  <div
                    key={notif.id}
                    className="w-full flex-shrink-0"
                  >
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-secondary/20 hover:border-secondary/40 shadow-lg hover:shadow-xl transition-all p-4 md:p-5 h-full flex items-center gap-4 cursor-pointer group">
                      {/* Icon */}
                      <div className="text-3xl md:text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        {notif.icon}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-secondary uppercase tracking-wide mb-1">
                          {notif.title}
                        </p>
                        <p className="text-sm md:text-base font-semibold text-foreground truncate">
                          {notif.message}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-secondary/40 group-hover:text-secondary flex-shrink-0 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {notifications.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setNotificationIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === notificationIndex 
                      ? "bg-secondary w-8" 
                      : "bg-secondary/30 w-2 hover:bg-secondary/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN HERO SECTION ========== */}
      <div className="relative py-12 md:py-20 px-4">
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-6xl mx-auto text-center space-y-6 md:space-y-8">
          <div className="space-y-4 md:space-y-6">
            <Logo size={60} showText={true} />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Find Your Perfect Opportunity Today
              </span>
            </h1>
            <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Connect talented workers with amazing opportunities. Build your career with India's most trusted work platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 md:pt-8">
            {user ? (
              <>
                <Button
                  onClick={() => router.push(`/${locale}/projects`)}
                  className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Find Jobs <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="border-2 border-secondary text-secondary hover:bg-secondary/10 bg-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg h-auto rounded-xl transition-all"
                >
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push(`/${locale}/create-account`)}
                  className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => router.push(`/${locale}/login`)}
                  className="border-2 border-primary/30 text-foreground hover:bg-primary/5 bg-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg h-auto rounded-xl transition-all"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 border border-secondary/30 hover:border-secondary/50 transition-colors">
              <p className="text-2xl md:text-3xl font-bold text-secondary">10K+</p>
              <p className="text-foreground/60 text-xs md:text-sm mt-2">Active Users</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 border border-primary/30 hover:border-primary/50 transition-colors">
              <p className="text-2xl md:text-3xl font-bold text-primary">5K+</p>
              <p className="text-foreground/60 text-xs md:text-sm mt-2">Jobs Posted</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 border border-accent/30 hover:border-accent/50 transition-colors">
              <p className="text-2xl md:text-3xl font-bold text-accent">4.8★</p>
              <p className="text-foreground/60 text-xs md:text-sm mt-2">Average Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FEATURES SECTION ========== */}
      <div className="py-16 md:py-24 px-4 bg-gradient-to-b from-transparent via-white to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Why Choose VaaniKaam?</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Zap,
                title: "Quick Apply",
                desc: "Apply to jobs in seconds with your verified profile",
                color: "from-primary to-accent"
              },
              {
                icon: Shield,
                title: "Verified Workers",
                desc: "All workers are verified with background checks",
                color: "from-secondary to-accent"
              },
              {
                icon: Clock,
                title: "24/7 Support",
                desc: "Round-the-clock customer support for all queries",
                color: "from-primary to-secondary"
              },
              {
                icon: Award,
                title: "Ratings & Reviews",
                desc: "Build your reputation with genuine reviews",
                color: "from-accent to-secondary"
              }
            ].map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <Card key={idx} className="bg-white/80 backdrop-blur-sm border border-secondary/20 hover:border-secondary/40 hover:shadow-xl transition-all rounded-xl overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${feature.color}`}></div>
                  <CardContent className="pt-6">
                    <div className={`inline-flex p-3 rounded-lg mb-4 bg-gradient-to-br ${feature.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-foreground font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== POPULAR JOBS SECTION ========== */}
      {user && (
        <div className="py-16 md:py-24 px-4 bg-gradient-to-b from-secondary/5 via-white to-accent/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Popular Jobs Near You</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  title: "Plumber Needed",
                  location: "Bilimora",
                  pay: "₹1,200/day",
                  distance: "1.2 km",
                  urgency: "Urgent",
                  urgencyColor: "from-red-500 to-rose-500"
                },
                {
                  title: "Painter for Interior Work",
                  location: "Navsari",
                  pay: "₹950/day",
                  distance: "2.8 km",
                  urgency: "Today",
                  urgencyColor: "from-secondary to-accent"
                },
                {
                  title: "Construction Helper",
                  location: "Valsad",
                  pay: "₹1,100/day",
                  distance: "3.4 km",
                  urgency: "Flexible",
                  urgencyColor: "from-primary to-secondary"
                },
              ].map((job, idx) => (
                <Card key={idx} className="bg-white/90 backdrop-blur-sm border border-secondary/20 hover:border-secondary/40 hover:shadow-xl transition-all rounded-xl overflow-hidden cursor-pointer group">
                  <div className={`h-1 bg-gradient-to-r ${job.urgencyColor}`}></div>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-foreground font-bold text-lg group-hover:text-secondary transition-all">{job.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold text-white bg-gradient-to-r ${job.urgencyColor} whitespace-nowrap ml-2`}>
                        {job.urgency}
                      </span>
                    </div>
                    <div className="space-y-3 mb-6">
                      <p className="text-foreground/60 flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-secondary flex-shrink-0" />
                        {job.location} • {job.distance}
                      </p>
                      <p className="text-foreground font-bold flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-secondary flex-shrink-0" />
                        {job.pay}
                      </p>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white rounded-lg h-10 transition-all">
                      View Job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={() => router.push(`/${locale}/projects`)}
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-6 text-lg h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                View All Jobs <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========== HOW IT WORKS SECTION ========== */}
      <div className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 md:gap-4">
            {[
              { step: "1", title: "Create Profile", desc: "Sign up and create your profile in minutes", icon: Users },
              { step: "2", title: "Browse Jobs", desc: "Find opportunities matching your skills", icon: Target },
              { step: "3", title: "Apply Instantly", desc: "Apply to jobs with one click", icon: Smartphone },
              { step: "4", title: "Get Hired", desc: "Connect with employers and start earning", icon: CheckCircle }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="relative">
                  <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-6 text-center border border-secondary/20 hover:border-secondary/40 transition-colors">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-accent text-white font-bold text-lg mb-4">
                      {item.step}
                    </div>
                    <IconComponent className="h-8 w-8 text-secondary mx-auto mb-3" />
                    <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-foreground/60 text-sm">{item.desc}</p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:flex absolute -right-3 top-1/3 items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-secondary/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== CONTRACTOR IMPORTANT SECTION ========== */}
      {user && isContractor && (
        <div className="py-16 md:py-24 px-4 bg-gradient-to-br from-secondary/10 via-accent/10 to-primary/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Manage Your Contracts</h2>
              <p className="text-foreground/60 text-base md:text-lg">Keep track of your active projects and earnings</p>
              <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent mx-auto rounded-full mt-4"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Active Contracts Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-secondary/30 hover:border-secondary/50 hover:shadow-xl transition-all rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-2 bg-gradient-to-r from-secondary to-accent"></div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 group-hover:from-secondary/30 group-hover:to-accent/30 transition-colors">
                      <Briefcase className="h-7 w-7 text-secondary" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary font-bold text-xs">Active</span>
                  </div>
                  <h3 className="text-foreground font-bold text-2xl mb-2">3</h3>
                  <p className="text-foreground/70 text-sm mb-4">Active Contracts</p>
                  <Button className="w-full bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white rounded-lg h-10 transition-all">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Monthly Earnings Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/50 hover:shadow-xl transition-all rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                      <DollarSign className="h-7 w-7 text-primary" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-xs">This Month</span>
                  </div>
                  <h3 className="text-foreground font-bold text-2xl mb-2">₹18,500</h3>
                  <p className="text-foreground/70 text-sm mb-4">Total Earnings</p>
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-lg h-10 transition-all">
                    Withdraw <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Pending Projects Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-red-500/30 hover:border-red-500/50 hover:shadow-xl transition-all rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-2 bg-gradient-to-r from-red-500 to-rose-500"></div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 group-hover:from-red-200 group-hover:to-rose-200 transition-colors">
                      <AlertCircle className="h-7 w-7 text-red-600" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs">Pending</span>
                  </div>
                  <h3 className="text-foreground font-bold text-2xl mb-2">2</h3>
                  <p className="text-foreground/70 text-sm mb-4">Pending Projects</p>
                  <Button className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg h-10 transition-all">
                    Review <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 hover:border-secondary/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Completion Rate</p>
                <p className="text-2xl font-bold text-secondary">96%</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Average Rating</p>
                <p className="text-2xl font-bold text-primary">4.9★</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Total Projects</p>
                <p className="text-2xl font-bold text-accent">28</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 hover:border-secondary/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Response Time</p>
                <p className="text-2xl font-bold text-secondary">&lt;2 hr</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== WORKER IMPORTANT SECTION ========== */}
      {user && !isContractor && (
        <div className="py-16 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Your Work Stats</h2>
              <p className="text-foreground/60 text-base md:text-lg">Track your progress and opportunities</p>
              <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent mx-auto rounded-full mt-4"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Your Applications Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/50 hover:shadow-xl transition-all rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                      <Target className="h-7 w-7 text-primary" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-xs">Pending</span>
                  </div>
                  <h3 className="text-foreground font-bold text-2xl mb-2">5</h3>
                  <p className="text-foreground/70 text-sm mb-4">Job Applications</p>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-lg h-10 transition-all">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Earnings Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-secondary/30 hover:border-secondary/50 hover:shadow-xl transition-all rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-2 bg-gradient-to-r from-secondary to-primary"></div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 group-hover:from-secondary/30 group-hover:to-primary/30 transition-colors">
                      <DollarSign className="h-7 w-7 text-secondary" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary font-bold text-xs">Total</span>
                  </div>
                  <h3 className="text-foreground font-bold text-2xl mb-2">₹12,350</h3>
                  <p className="text-foreground/70 text-sm mb-4">Total Earnings</p>
                  <Button className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white rounded-lg h-10 transition-all">
                    History <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Profile Rating Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-accent/30 hover:border-accent/50 hover:shadow-xl transition-all rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-2 bg-gradient-to-r from-accent to-secondary"></div>
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 group-hover:from-accent/30 group-hover:to-secondary/30 transition-colors">
                      <Star className="h-7 w-7 text-accent" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-xs">4.8★</span>
                  </div>
                  <h3 className="text-foreground font-bold text-2xl mb-2">87</h3>
                  <p className="text-foreground/70 text-sm mb-4">Profile Views</p>
                  <Button className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 text-white rounded-lg h-10 transition-all">
                    Update Profile <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Jobs Completed</p>
                <p className="text-2xl font-bold text-primary">12</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 hover:border-secondary/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Your Rating</p>
                <p className="text-2xl font-bold text-secondary">4.8★</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Response Time</p>
                <p className="text-2xl font-bold text-accent">&lt;1 hr</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-colors text-center">
                <p className="text-foreground/60 text-sm font-medium mb-2">Success Rate</p>
                <p className="text-2xl font-bold text-primary">92%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CTA SECTION ========== */}
      <div className="py-16 md:py-24 px-4 bg-gradient-to-br from-secondary via-primary to-accent">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">Ready to Find Your Next Opportunity?</h2>
          <p className="text-lg md:text-xl text-white/80">Join thousands of workers who have found their dream jobs on VaaniKaam</p>
          {!user && (
            <Button
              onClick={() => router.push(`/${locale}/create-account`)}
              size="lg"
              className="bg-white text-secondary hover:bg-white/90 px-8 md:px-12 py-6 md:py-7 text-base md:text-lg h-auto rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all"
            >
              Create Account Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
