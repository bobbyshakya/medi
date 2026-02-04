'use client';

export default function PNGBanner() {
    const scrollToForm = () => {
        document.getElementById('join-us-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section
            onClick={scrollToForm}
            className="relative w-full h-auto md:min-h-[88vh] overflow-hidden cursor-pointer"
        >
            {/* Background Image */}
           
                <img
                    src="/png-banner.jpg"
                    alt="Medivisor Community Health Partners"
                    className="w-full h-full object-contain md:object-cover object-center"
                    loading="eager"
                />
                {/* Overlay */}


            {/* Logo */}
            <div className="absolute top-4 left-4 md:top-8 md:left-20 z-40">
                <img
                    src="/icon/Whale-logo.png"
                    alt="Medivisor Logo"
                    className="w-12 md:w-28"
                />
            </div>
        </section>
    );
}
