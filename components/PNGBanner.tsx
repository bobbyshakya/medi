'use client';

export default function PNGBanner() {
    const scrollToForm = () => {
        document.getElementById('join-us-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section 
            className="relative w-full h-[20vh] md:h-[88vh] overflow-hidden text-white cursor-pointer"
            onClick={scrollToForm}
        >
            {/* Background image */}
            <div className="absolute inset-0 w-full h-full">
                <img
                    src="/png-banner.jpg"
                    alt="Medivisor Community Health Partners"
                    className="w-full h-full object-contain md:object-cover"
                    loading="eager"
                />
                {/* Optional overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20"></div>
            </div>

            {/* Logo */}
            <div className="absolute top-0 left-6 md:left-20 z-40">
                <img
                    src="/icon/Whale-logo.png"
                    alt="Medivisor Logo"
                    className="w-10 md:w-28"
                />
            </div>
        </section>
    );
}
