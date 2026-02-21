"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Cloud, Plane, PlayCircle, Star, MapPin, Calendar, DollarSign } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Cloud className="h-8 w-8 text-blue-600" />
          <span className="font-heading text-3xl font-bold tracking-wider mt-1 text-[#1A1A1A]">SYNCROUTE</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-600">
          <a href="#" className="hover:text-blue-600 transition-colors">Destinations</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Tours</a>
          <a href="#" className="hover:text-blue-600 transition-colors">About</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Blog</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-300 rounded-full px-6 font-semibold hover:bg-gray-50 text-gray-700">Sign In</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl p-8 bg-white/95 backdrop-blur-lg border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-3xl mb-2 text-center text-gray-900">Welcome Back</DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                  Enter your dummy credentials to access SyncRoute.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-6">
                <Input className="rounded-xl h-12 bg-gray-50/50 border-gray-200 px-4" placeholder="Email" defaultValue="user@syncroute.demo" />
                <Input className="rounded-xl h-12 bg-gray-50/50 border-gray-200 px-4" type="password" placeholder="Password" defaultValue="password123" />
                <div className="pt-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 text-md font-semibold font-sans shadow-lg shadow-blue-500/25">Login to SyncRoute</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-32 mb-32">

        {/* HERO SECTION */}
        <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 relative h-[550px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-blue-900/5">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
              alt="Mountain display"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-12 flex flex-col justify-center">
              <p className="text-white/90 uppercase tracking-[0.2em] text-sm font-semibold mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-white/60"></span>
                Create Unforgettable
              </p>
              <h1 className="font-heading text-white text-6xl md:text-8xl leading-[0.85] tracking-tight">
                MEMORIES<br />
                <span className="text-white/60 text-4xl md:text-6xl my-2 block">WITH OUR</span>
                SYNCROUTE
              </h1>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 h-[550px]">
            {/* Component 1 Video Card */}
            <div className="relative flex-[0.45] rounded-[2.5rem] overflow-hidden group cursor-pointer bg-black shadow-xl shadow-black/10">
              <img
                src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80"
                alt="Profile Video"
                className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2 drop-shadow-md">Watch Our</p>
                <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10 group-hover:bg-black/30 transition-colors">
                  <h3 className="text-white font-medium text-lg leading-tight">Profile<br />Video</h3>
                  <div className="bg-white/20 p-3 rounded-full hover:bg-white/40 transition-colors shadow-lg">
                    <PlayCircle className="text-white w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Component 2 Info Card */}
            <div className="flex-[0.55] bg-[#1C1C1E] rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl">
              <div className="bg-white/10 w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:rotate-[15deg] group-hover:bg-blue-500/20 transition-all duration-500">
                <Plane className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <p className="text-[15px] text-gray-300 leading-relaxed font-normal">
                  Let us take you on a journey of discovery, adventure, and relaxation. Book now or contact us for more information.
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH BAR (Floating) */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 lg:left-16 lg:translate-x-0 w-[90%] lg:w-3/4 max-w-4xl bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-4 flex flex-col md:flex-row gap-4 items-center justify-between z-10 transition-transform hover:-translate-y-1">
            <div className="flex flex-col flex-1 px-6 border-r border-gray-100 last:border-0 w-full hover:bg-gray-50/50 rounded-xl py-2 transition-colors cursor-text">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">Destination <span className="text-blue-500 rotate-180">^</span></p>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-1.5 rounded-md hidden md:block">
                  <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <input type="text" placeholder="Yogyakarta, Indonesia" className="w-full text-[15px] font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-900" />
              </div>
            </div>
            <div className="flex flex-col flex-1 px-6 border-r border-gray-100 last:border-0 w-full hover:bg-gray-50/50 rounded-xl py-2 transition-colors cursor-text">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">Date <span className="text-blue-500 rotate-180">^</span></p>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-1.5 rounded-md hidden md:block">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <input type="text" placeholder="March 23, 2026" className="w-full text-[15px] font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-900" />
              </div>
            </div>
            <div className="flex flex-col flex-1 px-6 w-full hover:bg-gray-50/50 rounded-xl py-2 transition-colors cursor-text">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">Price <span className="text-blue-500 rotate-180">^</span></p>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-1.5 rounded-md hidden md:block">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                </div>
                <input type="text" placeholder="$1,000 - $2,000" className="w-full text-[15px] font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-900" />
              </div>
            </div>
            <div className="pr-2">
              <Button className="w-full md:w-auto bg-[#4285F4] hover:bg-[#3367d6] rounded-2xl px-12 py-7 text-[15px] font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
                Search
              </Button>
            </div>
          </div>
        </section>


        {/* ABOUT SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center pt-8">
          <div className="relative h-[650px] rounded-[3rem] overflow-hidden shadow-2xl shadow-black/5 group">
            <img
              src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80"
              alt="Wind Turbines"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply" />
          </div>
          <div className="flex flex-col gap-10 lg:pr-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-px bg-blue-500"></span>
                <p className="text-blue-500 font-bold tracking-[0.2em] text-sm uppercase">About</p>
              </div>
              <h2 className="font-heading text-6xl md:text-8xl leading-[0.85] tracking-tight text-[#1A1A1A]">
                MEMORABLE<br />TRAVELS
              </h2>
            </div>
            <p className="text-gray-500 leading-[1.8] text-[15px] font-medium">
              SyncRoute Travel Agency is the perfect travel agency for your every memorable trip. With our expert guides, we are both professional and personal. Our trips consist of unforgettable experiences and are delivered in a sustainable way to protect the environment.
            </p>

            <div className="flex gap-16 pt-8 border-t border-gray-200">
              <div className="group">
                <h3 className="font-heading text-6xl mb-2 text-gray-900 group-hover:text-blue-500 transition-colors">20+</h3>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">years of experience</p>
              </div>
              <div className="w-px bg-gray-200 h-20"></div>
              <div className="group">
                <h3 className="font-heading text-6xl mb-2 text-gray-900 group-hover:text-blue-500 transition-colors">100+</h3>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">destination countries</p>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION (OUR ADVENTURES) */}
        <section className="pt-8">
          <div className="text-center mb-16 flex flex-col items-center">
            <p className="text-blue-500 font-bold tracking-[0.2em] text-sm uppercase mb-3 text-center">Gallery</p>
            <h2 className="font-heading text-6xl md:text-7xl tracking-tight text-[#1A1A1A]">
              OUR ADVENTURES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Big Feature Image */}
            <div className="md:col-span-3 h-[500px] relative rounded-[3rem] overflow-hidden group shadow-2xl shadow-blue-900/10">
              <img
                src="https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80"
                alt="Switzerland"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 pb-12 flex justify-center">
                <Button variant="outline" className="bg-white/20 hover:bg-white border-white/40 text-white hover:text-black backdrop-blur-md rounded-full px-10 py-6 text-xs font-bold tracking-[0.2em] transition-all hover:scale-105 shadow-xl">
                  FOLLOW US ON @SYNCROUTE_APP
                </Button>
              </div>
            </div>
            {/* Small images */}
            <div className="h-56 rounded-[2rem] overflow-hidden relative group shadow-lg">
              <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80" alt="Paris" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="h-56 rounded-[2rem] overflow-hidden relative group shadow-lg">
              <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80" alt="Hike" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="h-56 rounded-[2rem] overflow-hidden relative group shadow-lg">
              <img src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80" alt="Cherry Blossoms" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
          </div>
        </section>

        {/* TESTIMONIAL SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center pt-16">
          <div className="relative h-[650px] rounded-[3rem] overflow-hidden order-2 lg:order-1 shadow-2xl shadow-blue-900/10 group">
            <img
              src="https://images.unsplash.com/photo-1516483638261-f40af5bf2216?auto=format&fit=crop&q=80"
              alt="Testimonial Venice"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 object-right"
            />
          </div>
          <div className="flex flex-col gap-8 order-1 lg:order-2 lg:pl-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-blue-500 font-bold tracking-[0.2em] text-sm uppercase">Testimonial</p>
              </div>
              <h2 className="font-heading text-6xl md:text-8xl leading-[0.85] tracking-tight text-[#1A1A1A]">
                WHAT THEY<br />SAY ABOUT US
              </h2>
            </div>
            <p className="text-gray-600 leading-[1.9] text-[16px] italic bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 relative mt-4 font-medium">
              <span className="text-blue-500 text-6xl font-heading absolute -top-4 -left-2 opacity-20">"</span>
              I recently booked a trip to Italy through SyncRoute, and I couldn't be happier with the experience. From the initial inquiry to the post-trip follow-up, everything was handled with the utmost professionalism and care. Our itinerary was perfectly balanced providing amazing insights. Highly recommend to anyone looking for stress-free travel.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="flex text-yellow-400 mb-2 gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="font-bold text-gray-900 text-lg">Sarah Johnson</p>
                <p className="text-[13px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Client from United States</p>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES SECTION (Preview snippet as in image bottom) */}
        <section className="pt-16 pb-12 flex flex-col items-center">
          <p className="text-blue-500 font-bold tracking-[0.2em] text-sm uppercase mb-3 text-center">Values</p>
          <h2 className="font-heading text-6xl md:text-7xl tracking-tight text-[#1A1A1A]">
            OUR VALUES
          </h2>
          <div className="mt-8">
            <div className="w-24 h-2 bg-blue-500 rounded-full mx-auto"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
