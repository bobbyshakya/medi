'use client';

export default function PNGBanner() {
    const scrollToForm = () => {
        document.getElementById('join-us-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section

            className="relative w-full overflow-hidden cursor-pointer"
        >
            {/* ================= DESKTOP BANNER ================= */}
            <div className="relative hidden md:block min-h-[88vh] w-full">
                {/* Background */}
              
                <img
                    src="/banner/extend-banner.jpeg"
                    alt="Medivisor PNG Banner"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Left content is already baked into image */}

                {/* Right Content */}
                {/* <div className="absolute right-28 top-12 z-30 max-w-2xl text-white">
                    <h1 className="text-6xl lg:text-5xl 2xl:text-[55px] font-bold leading-tight uppercase">
                        Medivisor Expanded <br />
                        Patient Support <br />
                        Network (PNG)
                    </h1>

                    <button
                        onClick={scrollToForm}
                        className="
        
              hover:bg-[#E22026]  cursor-pointer md:block hidden mt-2 bg-[#74BF44] text-white font-medium px-5 py-2 rounded-md shadow-md transition-all
             
        inline-flex items-center justify-center font-medium tracking-wide transition duration-300 ease-in-out
        text-lg px-12 py-2 rounded-lg"
                    >
                        JOIN US
                    </button>
                </div> */}

                {/* Whale Logo */}
                <div className="absolute  left-20 z-40">
                    <img
                        src="/icon/Whale-logo.png"
                        alt="Whale Certified"
                        className="w-28"
                    />
                </div>
            </div>

            {/* ================= MOBILE BANNER ================= */}
            <div className="relative md:hidden w-full">
                {/* Mobile Image */}
                <img
                    src="/PNG-Web-Banner-fb.jpg"
                    alt="Medivisor PNG Mobile Banner"
                    className="w-full h-auto object-cover"
                />

               
            </div>
        </section>
    );
}
