"use client"

import Image from "next/image"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, TreesIcon as Lungs, PlusCircle, HeartPulse, Ribbon, Brain, XIcon as XRay, Syringe, BabyIcon as Kidney, Stethoscope, StickerIcon as Stomach, Bone, Eye, Baby, Scale, Handshake, Users, X } from 'lucide-react'

// Define the treatments data
const treatmentsData = [
    {
        title: "Heart Bypass",
        description: "Advanced surgical procedures to restore optimal blood flow, enhancing cardiac function and patient vitality.",
        image: "/services/heart-bypass.jpg",
        icon: Heart,
    },
    {
        title: "Valve Replacement",
        description: "Surgical replacement of diseased heart valves, ensuring efficient circulation and improved heart health.",
        image: "/public/services/valve-heart.jpg",
        icon: Lungs, // Using Lungs as a suitable alternative for heart valve
    },
    {
        title: "Stenting (Angioplasty)",
        description: "Minimally invasive procedures to open blocked arteries, restoring vital blood flow and preventing cardiac events.",
        image: "/services/Stenting-Angioplasty.jpg",
        icon: PlusCircle,
    },
    {
        title: "ASD and VSD Closures",
        description: "Specialized surgical repair for congenital heart defects like ASD and VSD, promoting healthy heart development.",
        image: "/services/view-anatomic-heart-model-educational-purpose.jpg",
        icon: HeartPulse,
    },
    {
        title: "Cancer Treatment",
        description: "Comprehensive oncology care, utilizing advanced therapies like chemotherapy and radiation for effective disease management.",
        image: "/services/oncology.jpg",
        icon: Ribbon,
    },
    {
        title: "Tumour Removal",
        description: "Precise surgical excision of tumors, focusing on complete removal with minimal disruption to surrounding tissues.",
        image: "/services/mature-oncologist.jpg",
        icon: Brain, // Can be brain tumor or other
    },
    {
        title: "Radiotherapy & Chemotherapy",
        description: "Targeted cancer treatments employing state-of-the-art radiotherapy and chemotherapy protocols for effective disease management.",
        image: "/services/radiologist-mature.jpg",
        icon: XRay,
    },
    {
        title: "Bone Marrow Transplants",
        description: "Advanced transplantation procedures for hematological disorders and cancers, facilitating the growth of healthy blood cells.",
        image: "/services/medical-ganglion-foot-cyst-with-bones-doctor.jpg",
        icon: Syringe,
    },
    {
        title: "Kidney Transplants",
        description: "Life-changing kidney transplantation services, providing a new lease on life for patients with end-stage renal disease.",
        image: "/services/surgeons-performing-operation.jpg",
        icon: Kidney,
    },
    {
        title: "Liver Transplants",
        description: "Highly specialized liver transplantation, offering critical intervention for severe liver conditions and promoting long-term wellness.",
        image: "/services/xamedical-meeting-laptop.jpg",
        icon: Stethoscope, // Using a generic medical icon
    },
    {
        title: "Stone Removal",
        description: "Effective and minimally invasive techniques for the removal of kidney, bladder, and urinary tract stones.",
        image: "/services/pain-stomache-old-senior.jpg",
        icon: Stomach, // Using Stomach for stone removal
    },
    {
        title: "Brain and Spine Surgeries",
        description: "Expert neurosurgical interventions for complex conditions affecting the brain and spinal cord, enhancing neurological function.",
        image: "/services/back-view-man-patient-wearing-performant.jpg",
        icon: Brain,
    },
    {
        title: "Knee and Hip Replacements",
        description: "Restoring mobility and alleviating pain through advanced knee and hip joint replacement surgeries.",
        image: "/services/ultrasound-specialist-scans.jpg",
        icon: Bone, // Using Bone for joint
    },
    {
        title: "Eye Treatment",
        description: "Comprehensive ophthalmological services, from vision correction to advanced surgical treatments for various eye conditions.",
        image: "/services/man-having-ophthalmology.jpg",
        icon: Eye,
    },
    {
        title: "Infertility and IVF",
        description: "Leading-edge fertility treatments, including IVF, to support individuals and couples on their journey to parenthood.",
        image: "/services/positive-qualified-involved.jpg",
        icon: Baby,
    },
    {
        title: "Weight Loss Surgeries",
        description: "Effective bariatric surgery options combined with holistic support for significant and sustainable weight management.",
        image: "/services/nutritionist-measuring-teenager.jpg",
        icon: Scale, // Using Scale for weight
    },
    {
        title: "Reconstructive Surgeries",
        description: "Specialized reconstructive procedures to restore form and function following trauma, disease, or birth defects.",
        image: "/services/plastic-surgeon-drawing-dashed.jpg",
        icon: Handshake, // Using Handshake for medical
    },
    {
        title: "Sexual Health",
        description: "Discreet and comprehensive medical care focused on addressing and improving aspects of sexual health for all individuals.",
        image: "/services/beautiful-girl-frustrated-man-sitting.jpg",
        icon: Users, // Using Users for sexual health
    },
]

// Create a map for easy lookup of treatments by title
const treatmentsMap = new Map(treatmentsData.map((t) => [t.title, t]))

// Define the interactive areas (hotspots) and their associated treatment titles
// Each hotspot now corresponds to a single treatment for precise mapping
const hotspots = [
    // Head Area
    { id: "eye-treatment", title: "Eye Treatment", area: { top: "8%", left: "40%", width: "15%", height: "3%" }, tooltipPosition: { top: "5%", left: "105%" } },
    { id: "brain-spine-surgeries", title: "Brain and Spine Surgeries", area: { top: "0%", left: "35%", width: "30%", height: "10%" }, tooltipPosition: { top: "5%", left: "105%" } },
    { id: "tumour-removal-head", title: "Tumour Removal", area: { top: "3%", left: "40%", width: "20%", height: "5%" }, tooltipPosition: { top: "15%", left: "105%" } },

    // Chest/Torso Area - Heart related (right side of image)
    { id: "heart-bypass", title: "Heart Bypass", area: { top: "19%", left: "48%", width: "15%", height: "5%" }, tooltipPosition: { top: "20%", left: "105%" } },
    { id: "valve-replacement", title: "Valve Replacement", area: { top: "24%", left: "48%", width: "15%", height: "5%" }, tooltipPosition: { top: "25%", left: "105%" } },
    { id: "stenting-angioplasty", title: "Stenting (Angioplasty)", area: { top: "29%", left: "48%", width: "15%", height: "5%" }, tooltipPosition: { top: "30%", left: "105%" } },
    { id: "asd-vsd-closures", title: "ASD and VSD Closures", area: { top: "34%", left: "48%", width: "15%", height: "5%" }, tooltipPosition: { top: "35%", left: "105%" } },

    // Chest/Torso Area - Oncology related (left side of image)
    { id: "cancer-treatment", title: "Cancer Treatment", area: { top: "15%", left: "30%", width: "15%", height: "5%" }, tooltipPosition: { top: "15%", left: "-5%" } },
    { id: "tumour-removal-chest", title: "Tumour Removal", area: { top: "20%", left: "30%", width: "15%", height: "5%" }, tooltipPosition: { top: "20%", left: "-5%" } },
    { id: "radiotherapy-chemotherapy", title: "Radiotherapy & Chemotherapy", area: { top: "25%", left: "30%", width: "15%", height: "5%" }, tooltipPosition: { top: "25%", left: "-5%" } },

    { id: "liver-transplants", title: "Liver Transplants", area: { top: "39%", left: "50%", width: "15%", height: "5%" }, tooltipPosition: { top: "40%", left: "105%" } },
    { id: "weight-loss-surgeries", title: "Weight Loss Surgeries", area: { top: "44%", left: "35%", width: "30%", height: "5%" }, tooltipPosition: { top: "45%", left: "105%" } },

    // Abdominal/Pelvis Area
    { id: "kidney-transplants", title: "Kidney Transplants", area: { top: "49%", left: "30%", width: "15%", height: "5%" }, tooltipPosition: { top: "50%", left: "105%" } },
    { id: "stone-removal", title: "Stone Removal", area: { top: "49%", left: "55%", width: "15%", height: "5%" }, tooltipPosition: { top: "50%", left: "105%" } },
    { id: "infertility-ivf", title: "Infertility and IVF", area: { top: "56%", left: "35%", width: "30%", height: "5%" }, tooltipPosition: { top: "60%", left: "105%" } },
    // Repositioned Sexual Health to a more central pelvic area
    { id: "sexual-health", title: "Sexual Health", area: { top: "61%", left: "40%", width: "20%", height: "5%" }, tooltipPosition: { top: "65%", left: "105%" } },
    { id: "bone-marrow-transplants", title: "Bone Marrow Transplants", area: { top: "54%", left: "35%", width: "30%", height: "5%" }, tooltipPosition: { top: "55%", left: "105%" } },


    // Limbs - Arms
    { id: "reconstructive-surgeries-arm-left", title: "Reconstructive Surgeries", area: { top: "20%", left: "0%", width: "28%", height: "30%" }, tooltipPosition: { top: "25%", left: "-5%" } },
    { id: "reconstructive-surgeries-arm-right", title: "Reconstructive Surgeries", area: { top: "20%", left: "72%", width: "28%", height: "30%" }, tooltipPosition: { top: "25%", left: "105%" } },

    // Limbs - Legs
    { id: "knee-hip-replacements-left", title: "Knee and Hip Replacements", area: { top: "68%", left: "30%", width: "20%", height: "10%" }, tooltipPosition: { top: "70%", left: "-5%" } },
    { id: "knee-hip-replacements-right", title: "Knee and Hip Replacements", area: { top: "68%", left: "50%", width: "20%", height: "10%" }, tooltipPosition: { top: "70%", left: "105%" } },
    { id: "reconstructive-surgeries-leg-left", title: "Reconstructive Surgeries", area: { top: "78%", left: "30%", width: "20%", height: "20%" }, tooltipPosition: { top: "75%", left: "-5%" } },
    { id: "reconstructive-surgeries-leg-right", title: "Reconstructive Surgeries", area: { top: "78%", left: "50%", width: "20%", height: "20%" }, tooltipPosition: { top: "75%", left: "105%" } },
]

export default function HumanAnatomyInteractive() {
    const [hoveredTreatmentTitle, setHoveredTreatmentTitle] = useState<string | null>(null)
    const [activeTreatmentTitle, setActiveTreatmentTitle] = useState<string | null>(null) // New state for clicked treatment
    const [hoveredHotspotPosition, setHoveredHotspotPosition] = useState<{ top: string; left: string } | null>(null)
    const [lineCoords, setLineCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
    const [showInitialContent, setShowInitialContent] = useState(true) // New state for initial content

    // Determine which treatment is currently "active" (either hovered or clicked)
    const currentTreatmentTitle = activeTreatmentTitle || hoveredTreatmentTitle
    const currentTreatment = currentTreatmentTitle ? treatmentsMap.get(currentTreatmentTitle) : null

    const handleHotspotEnter = (hotspot: typeof hotspots[0]) => {
        setShowInitialContent(false) // Hide initial content on any interaction
        if (!activeTreatmentTitle) { // Only update hover state if no treatment is actively clicked
            setHoveredTreatmentTitle(hotspot.title)
            setHoveredHotspotPosition(hotspot.tooltipPosition)
            const cx_hotspot = parseFloat(hotspot.area.left) + parseFloat(hotspot.area.width) / 2
            const cy_hotspot = parseFloat(hotspot.area.top) + parseFloat(hotspot.area.height) / 2
            const x_line_end = hotspot.tooltipPosition.left.includes("-") ? 2 : 98
            setLineCoords({ x1: cx_hotspot, y1: cy_hotspot, x2: x_line_end, y2: cy_hotspot })
        }
    }

    const handleHotspotLeave = () => {
        if (!activeTreatmentTitle) { // Only clear hover state if no treatment is actively clicked
            setHoveredTreatmentTitle(null)
            setHoveredHotspotPosition(null)
            setLineCoords(null)
            setShowInitialContent(true) // Show initial content if nothing is active
        }
    }

    const handleHotspotClick = (hotspot: typeof hotspots[0]) => {
        setShowInitialContent(false) // Hide initial content on any interaction
        if (activeTreatmentTitle === hotspot.title) {
            // If the same hotspot is clicked again, deactivate it
            setActiveTreatmentTitle(null)
            setHoveredTreatmentTitle(null) // Clear hover state too
            setHoveredHotspotPosition(null)
            setLineCoords(null)
            setShowInitialContent(true) // Show initial content if nothing is active
        } else {
            // Activate this hotspot
            setActiveTreatmentTitle(hotspot.title)
            setHoveredTreatmentTitle(hotspot.title) // Also set hover to ensure immediate display
            setHoveredHotspotPosition(hotspot.tooltipPosition)
            const cx_hotspot = parseFloat(hotspot.area.left) + parseFloat(hotspot.area.width) / 2
            const cy_hotspot = parseFloat(hotspot.area.top) + parseFloat(hotspot.area.height) / 2
            const x_line_end = hotspot.tooltipPosition.left.includes("-") ? 2 : 98
            setLineCoords({ x1: cx_hotspot, y1: cy_hotspot, x2: x_line_end, y2: cy_hotspot })
        }
    }

    const handleCloseTooltip = () => {
        setActiveTreatmentTitle(null)
        setHoveredTreatmentTitle(null)
        setHoveredHotspotPosition(null)
        setLineCoords(null)
        setShowInitialContent(true) // Show initial content when closed
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center  justify-center p-4">
            {/* Background image using Tailwind's bg-[url()] */}
            <div className="absolute inset-0 0">
                <img
                    src="/geometric.png"
                    alt="Background"
                    fill
                    className="bg-contain w-full"

                    priority
                />
                <div className="absolute inset-0 bg-[#E22026]/10" />
            </div>
            {/* Content on top of background */}
            <div className=" z-10">
                <div className="absolute w-1/3 top-20 left-20">


                    <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Explore Our Key Medical Treatments for a Healthier Tomorrow
                    </h2>
                    <p className="text-lg md:text-xl text-[#241d1f] max-w-3xl">
                        At our advanced care centers, we offer a comprehensive range of specialized treatments designed to meet the unique health needs of each individual.
                    </p>

                    <div className="flex justify-start mt-10">  <a href="/treatment-service">
                        <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 bg-[#E22026] w-auto text-white text-sm md:text-lg font-medium px-4 md:px-16 py-3 md:py-4 rounded-md hover:bg-[#74BF44] transition-all duration-300 transform modal-open-btn cursor-pointer hover:scale-105 mt-auto">Explore Services</button></a></div>
                </div>




                <div className="relative w-full max-w-xl aspect-[10/16] flex items-center justify-center">
                    {/* Main anatomy image */}
                    <img
                        src="/man-structure.png"
                        alt="Human Anatomy X-ray"

                        className="z-0"
                    />

                    {/* Hotspot overlays */}
                    {hotspots.map((hotspot) => (
                        <div
                            key={hotspot.id}
                            className="absolute z-10 cursor-pointer transition-all duration-300 ease-in-out"
                            style={{
                                top: hotspot.area.top,
                                left: hotspot.area.left,
                                width: hotspot.area.width,
                                height: hotspot.area.height,
                                backgroundColor:
                                    hoveredTreatmentTitle === hotspot.title || activeTreatmentTitle === hotspot.title
                                        ? "rgba(244, 97, 97, 0.31)"
                                        : "transparent",
                                borderRadius: "4px",
                            }}
                            onMouseEnter={() => handleHotspotEnter(hotspot)}
                            onMouseLeave={handleHotspotLeave}
                            onClick={() => handleHotspotClick(hotspot)}
                        />
                    ))}

                    {/* Line drawing */}
                    {lineCoords && currentTreatmentTitle && (
                        <svg className="absolute inset-0 w-full h-full z-15 pointer-events-none">
                            <line
                                x1={`${lineCoords.x1}%`}
                                y1={`${lineCoords.y1}%`}
                                x2={`${lineCoords.x2}%`}
                                y2={`${lineCoords.y2}%`}
                                stroke="#E22026"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                                className="transition-all duration-300 ease-out"
                            />
                        </svg>
                    )}

                    {/* Treatment Card */}
                    {currentTreatment && hoveredHotspotPosition && (
                        <Card
                            className="absolute z-20 w-[500px] bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl transition-all duration-300 ease-in-out"
                            style={{
                                top: hoveredHotspotPosition.top,
                                left: hoveredHotspotPosition.left,
                                transform: hoveredHotspotPosition.left.includes("-") ? "translateX(-100%)" : "translateX(0%)",
                                opacity: 1,
                                pointerEvents: activeTreatmentTitle ? "auto" : "none",
                            }}
                        >
                            <CardHeader className="p-3 pb-1 relative">
                                <div className="flex items-center">
                                    {currentTreatment.icon && (
                                        <currentTreatment.icon className="w-5 h-5 text-black mr-2" />
                                    )}
                                    <CardTitle className="text-lg">{currentTreatment.title}</CardTitle>
                                </div>
                                {activeTreatmentTitle && (
                                    <button
                                        onClick={handleCloseTooltip}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </CardHeader>
                            <CardContent className="p-3 pt-0 text-lg text-[#241d1f]">
                                {currentTreatment.image && (
                                    <div className="relative w-full h-60 mb-2 rounded-md overflow-hidden">
                                        <Image
                                            src={currentTreatment.image || "/placeholder.svg"}
                                            alt={currentTreatment.title}
                                            fill
                                            objectFit="cover"
                                            className="rounded-md"
                                        />
                                    </div>
                                )}
                                {currentTreatment.description}
                            </CardContent>
                        </Card>
                    )}

                    {/* Initial prompt card */}
                    {showInitialContent && !currentTreatmentTitle && (
                        <Card
                            className="absolute border-gray-200  bg-white  z-20 w-[500px] rounded-md transition-all duration-300 ease-in-out"
                            style={{
                                top: "60%",
                                left: "105%",
                                transform: "translateY(-50%)",
                                opacity: 1,
                                pointerEvents: "none",
                            }}
                        >
                            {/* <img src="/services/heart-bypass.jpg" className="rounded-md "/> */}
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-lg text-black">Discover Our Treatments</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 text-lg text-[#241d1f]">
                                Hover over different parts of the human body to explore our specialized medical treatments. Click to keep the information visible.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>

    )
}
