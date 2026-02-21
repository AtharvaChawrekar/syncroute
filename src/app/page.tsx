"use client";

import { Button } from "@/components/ui/button";
import { Plane, PlayCircle, Star, MapPin, Calendar, DollarSign, Facebook, Twitter, Instagram } from "lucide-react";
import { AuthButtons } from "@/components/auth-buttons";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#121212] font-sans scroll-smooth transition-colors duration-300">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md sticky top-0 z-50 shadow-sm transition-colors border-b border-gray-100 dark:border-white/10">
        <a href="/" className="flex items-center gap-3 cursor-pointer">
          <img src="/logo.png" alt="SyncRoute" className="h-9 w-9 object-contain" />
          <span className="font-heading text-3xl tracking-[0.15em] mt-1 text-[#1A1A1A] dark:text-white">SYNC<span className="text-blue-500">ROUTE</span></span>
        </a>

        <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-600 dark:text-gray-300 font-sans">
          <a href="#gallery" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Destinations</a>
          <a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</a>
          <a href="#contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
        </div>

        <AuthButtons />
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
            <div className="relative flex-[0.55] rounded-[2.5rem] overflow-hidden group shadow-xl bg-black">
              <img
                src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80"
                alt="Journey"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="absolute inset-0 p-10 flex flex-col justify-between text-white">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:rotate-[15deg] group-hover:bg-blue-500/30 transition-all duration-500 z-10">
                  <Plane className="w-6 h-6 text-white group-hover:text-blue-300 transition-colors" />
                </div>
                <div className="z-10">
                  <p className="text-[15px] text-gray-200 leading-relaxed font-normal">
                    Let us take you on a journey of discovery, adventure, and relaxation. Plan now and experience AI-crafted perfection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR (Floating) */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 lg:left-16 lg:translate-x-0 w-[90%] lg:w-3/4 max-w-4xl bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-transparent dark:border-white/10 p-4 flex flex-col md:flex-row gap-4 items-center justify-between z-10 transition-transform hover:-translate-y-1">
            <div className="flex flex-col flex-1 px-6 border-r border-gray-100 dark:border-white/10 last:border-0 w-full hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-xl py-2 transition-colors cursor-text">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">Destination <span className="text-blue-500 rotate-180">^</span></p>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-md hidden md:block">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input type="text" placeholder="Yogyakarta, Indonesia" className="w-full text-[15px] font-semibold text-gray-800 dark:text-gray-200 outline-none bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-600" />
              </div>
            </div>
            <div className="flex flex-col flex-1 px-6 border-r border-gray-100 dark:border-white/10 last:border-0 w-full hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-xl py-2 transition-colors cursor-text">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">Date <span className="text-blue-500 rotate-180">^</span></p>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-md hidden md:block">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input type="text" placeholder="March 23, 2026" className="w-full text-[15px] font-semibold text-gray-800 dark:text-gray-200 outline-none bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-600" />
              </div>
            </div>
            <div className="flex flex-col flex-1 px-6 w-full hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-xl py-2 transition-colors cursor-text">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">Price <span className="text-blue-500 rotate-180">^</span></p>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-md hidden md:block">
                  <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input type="text" placeholder="$1,000 - $2,000" className="w-full text-[15px] font-semibold text-gray-800 dark:text-gray-200 outline-none bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-600" />
              </div>
            </div>
            <div className="pr-2">
              <Button className="w-full md:w-auto bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-2xl px-12 py-7 text-[15px] font-semibold shadow-lg shadow-blue-500/30 dark:shadow-none transition-all hover:scale-105">
                Search
              </Button>
            </div>
          </div>
        </section>


        {/* ABOUT SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center pt-8" id="about">
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
              <h2 className="font-heading text-6xl md:text-8xl leading-[0.85] tracking-tight text-[#1A1A1A] dark:text-white">
                MEMORABLE<br />TRAVELS
              </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.8] text-[15px] font-medium font-sans">
              SyncRoute is an intelligent itinerary planner and suggestor, not a traditional travel agency. By blending AI with real-time data, we curate flawless, regret-free plans customized to your personality and constraints, delivering experiences effortlessly.
            </p>

            <div className="flex gap-16 pt-8 border-t border-gray-200 dark:border-white/10">
              <div className="group">
                <h3 className="font-heading text-6xl mb-2 text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">100+</h3>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Personalized Itineraries</p>
              </div>
              <div className="w-px bg-gray-200 dark:bg-white/10 h-20"></div>
              <div className="group">
                <h3 className="font-heading text-6xl mb-2 text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">10K+</h3>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Points of Interest</p>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION (OUR ADVENTURES) */}
        <section className="pt-8 scroll-m-24" id="gallery">
          <div className="text-center mb-16 flex flex-col items-center">
            <p className="text-blue-500 font-bold tracking-[0.2em] text-sm uppercase mb-3 text-center">Gallery</p>
            <h2 className="font-heading text-6xl md:text-7xl tracking-tight text-[#1A1A1A] dark:text-white">
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
              src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80"
              alt="Testimonial Venice"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 object-center"
            />
          </div>
          <div className="flex flex-col gap-8 order-1 lg:order-2 lg:pl-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-blue-500 font-bold tracking-[0.2em] text-sm uppercase">Testimonial</p>
              </div>
              <h2 className="font-heading text-6xl md:text-8xl leading-[0.85] tracking-tight text-[#1A1A1A] dark:text-white">
                WHAT THEY<br />SAY ABOUT US
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-[1.9] text-[16px] italic bg-white dark:bg-[#1C1C1E]/80 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5 relative mt-4 font-medium transition-colors">
              <span className="text-blue-500 text-6xl font-heading absolute -top-4 -left-2 opacity-20">"</span>
              I recently booked a trip to Italy through SyncRoute, and I couldn't be happier with the experience. The AI generated an itinerary that was perfectly balanced between my high-energy moments and need for relaxation. Highly recommend to anyone looking for stress-free travel.
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
                <p className="font-bold text-gray-900 dark:text-white text-lg">Sarah Johnson</p>
                <p className="text-[13px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Early Adopter</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER SECTION */}
      <footer className="relative mt-20 pt-24 pb-12 overflow-hidden text-white px-8 md:px-16" id="contact" style={{ background: 'linear-gradient(to top, #000 30%, rgba(0,0,0,0.95) 60%, rgba(10,30,60,0.5)), url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80) center/cover no-repeat' }}>
        <div className="relative z-10 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="SyncRoute" className="h-9 w-9 object-contain" />
              <span className="font-heading text-4xl tracking-[0.15em] mt-1">SYNC<span className="text-blue-500">ROUTE</span></span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm font-sans">
              Reimagining travel planning through conversational AI and dynamic context-awareness. Say goodbye to spreadsheet itineraries and hello to intelligent exploration.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-blue-600 transition-colors border border-white/10 hover:border-transparent">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-blue-600 transition-colors border border-white/10 hover:border-transparent">
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-blue-600 transition-colors border border-white/10 hover:border-transparent">
                <Instagram className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-heading tracking-widest text-xl mb-6">Quick Links</h4>
            <div className="flex flex-col gap-4 text-white/70 font-sans text-sm">
              <a href="#" className="hover:text-blue-400 transition-colors">Home</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Destinations</a>
              <a href="#" className="hover:text-blue-400 transition-colors">About Us</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Sign In</a>
            </div>
          </div>
          <div>
            <h4 className="font-heading tracking-widest text-xl mb-6">Contact</h4>
            <div className="flex flex-col gap-4 text-white/70 font-sans text-sm">
              <p>support@syncroute.demo</p>
              <p>+1 (555) 123-4567</p>
              <p>San Francisco, CA</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 border-t border-white/10 mt-16 pt-8 text-center text-sm text-white/50 font-sans">
          <p>&copy; {new Date().getFullYear()} SyncRoute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
