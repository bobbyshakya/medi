"use client";

import React, { useState } from 'react';
import {
    Globe,
    Heart,
    Brain,
    Bone,
    Eye,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Building,
    Plane,
    Users,
    Shield,
    Award,
    Clock,
    Star,
    MapPin,
    Phone,
    Calendar,
    Stethoscope,
    Activity,
    UserCheck,
    Zap,
    Target,
    TrendingUp,
    Crown,
    Sparkles,
    ChevronRight
} from 'lucide-react';

interface ComparisonData {
    treatment: string;
    icon: any;
    india: {
        advantages: string[];
        facilities: string[];
        specialFeatures: string[];
    };
    others: {
        country: string;
        flag: string;
        advantages: string[];
        facilities: string[];
        limitations: string[];
    }[];
}

const comparisons: Record<string, ComparisonData> = {
    cardiac: {
        treatment: "Cardiac Surgery",
        icon: Heart,
        india: {
            advantages: [
                "World's largest cardiac surgery volume",
                "Advanced robotic cardiac procedures",
                "Experienced cardiac surgeons with 20+ years",
                "Comprehensive cardiac rehabilitation programs",
                "24/7 cardiac emergency services",
                "Latest cardiac imaging technology"
            ],
            facilities: [
                "500+ cardiac centers nationwide",
                "JCI accredited cardiac hospitals",
                "Dedicated cardiac ICUs",
                "Advanced catheterization labs",
                "Hybrid cardiac operating theaters",
                "Cardiac transplant facilities"
            ],
            specialFeatures: [
                "Minimally invasive cardiac surgery",
                "Pediatric cardiac programs",
                "Preventive cardiology services",
                "Cardiac rehabilitation centers"
            ]
        },
        others: [
            {
                country: "United States",
                flag: "🇺🇸",
                advantages: [
                    "Advanced research facilities",
                    "Latest medical technology",
                    "Comprehensive insurance coverage",
                    "Specialized cardiac centers"
                ],
                facilities: [
                    "Mayo Clinic cardiac program",
                    "Cleveland Clinic heart center",
                    "Johns Hopkins cardiac surgery",
                    "Advanced cardiac research"
                ],
                limitations: [
                    "Extremely high treatment costs",
                    "Long waiting periods",
                    "Complex insurance procedures",
                    "Limited accessibility for international patients"
                ]
            },
            {
                country: "Germany",
                flag: "🇩🇪",
                advantages: [
                    "Precision surgical techniques",
                    "Advanced medical engineering",
                    "Quality healthcare system",
                    "Research-based treatments"
                ],
                facilities: [
                    "Charité cardiac center",
                    "University cardiac hospitals",
                    "Advanced cardiac technology",
                    "Rehabilitation facilities"
                ],
                limitations: [
                    "High treatment expenses",
                    "Language barriers",
                    "Complex healthcare system",
                    "Limited appointment availability"
                ]
            }
        ]
    },
    orthopedic: {
        treatment: "Orthopedic Surgery",
        icon: Bone,
        india: {
            advantages: [
                "Leading joint replacement surgeries globally",
                "Advanced arthroscopic procedures",
                "Sports medicine expertise",
                "Comprehensive rehabilitation programs",
                "Latest orthopedic implants and technology",
                "Specialized spine surgery centers"
            ],
            facilities: [
                "600+ orthopedic hospitals",
                "Advanced joint replacement centers",
                "Sports injury rehabilitation",
                "Spine surgery specialists",
                "Arthroscopy centers",
                "Orthopedic trauma units"
            ],
            specialFeatures: [
                "Computer-assisted surgery",
                "Minimally invasive techniques",
                "Custom implant manufacturing",
                "Physiotherapy integration"
            ]
        },
        others: [
            {
                country: "United Kingdom",
                flag: "🇬🇧",
                advantages: [
                    "NHS healthcare system",
                    "Experienced orthopedic surgeons",
                    "Research-based treatments",
                    "Quality medical education"
                ],
                facilities: [
                    "NHS orthopedic departments",
                    "Private orthopedic clinics",
                    "University hospitals",
                    "Rehabilitation centers"
                ],
                limitations: [
                    "Long NHS waiting lists",
                    "High private treatment costs",
                    "Limited appointment slots",
                    "Weather-related joint issues"
                ]
            },
            {
                country: "Australia",
                flag: "🇦🇺",
                advantages: [
                    "Quality healthcare standards",
                    "Advanced surgical techniques",
                    "Sports medicine focus",
                    "Modern medical facilities"
                ],
                facilities: [
                    "Public hospital system",
                    "Private orthopedic centers",
                    "Sports medicine clinics",
                    "Rehabilitation facilities"
                ],
                limitations: [
                    "Very high treatment costs",
                    "Geographic accessibility issues",
                    "Limited specialist availability",
                    "Complex healthcare navigation"
                ]
            }
        ]
    },
    neurosurgery: {
        treatment: "Neurosurgery",
        icon: Brain,
        india: {
            advantages: [
                "World-class neurosurgical expertise",
                "Advanced brain tumor treatments",
                "Minimally invasive spine surgery",
                "Comprehensive stroke care",
                "Pediatric neurosurgery programs",
                "Neuro-rehabilitation facilities"
            ],
            facilities: [
                "300+ neurosurgery centers",
                "Advanced neuroimaging facilities",
                "Dedicated neuro ICUs",
                "Gamma knife centers",
                "Stereotactic surgery units",
                "Neuro-rehabilitation centers"
            ],
            specialFeatures: [
                "Awake brain surgery techniques",
                "Deep brain stimulation",
                "Endoscopic neurosurgery",
                "Neuro-oncology programs"
            ]
        },
        others: [
            {
                country: "Switzerland",
                flag: "🇨🇭",
                advantages: [
                    "Precision neurosurgical techniques",
                    "Advanced medical technology",
                    "High-quality healthcare",
                    "Research excellence"
                ],
                facilities: [
                    "University neurosurgery centers",
                    "Private neurosurgical clinics",
                    "Advanced imaging centers",
                    "Rehabilitation facilities"
                ],
                limitations: [
                    "Extremely expensive treatments",
                    "Limited accessibility",
                    "Complex appointment systems",
                    "High living costs during treatment"
                ]
            },
            {
                country: "Japan",
                flag: "🇯🇵",
                advantages: [
                    "Advanced robotic surgery",
                    "Precision medical technology",
                    "Quality healthcare system",
                    "Innovative treatments"
                ],
                facilities: [
                    "University hospitals",
                    "Advanced neurosurgery centers",
                    "Robotic surgery facilities",
                    "Research institutions"
                ],
                limitations: [
                    "Language communication barriers",
                    "Cultural differences in treatment",
                    "High treatment expenses",
                    "Complex healthcare procedures"
                ]
            }
        ]
    },
    oncology: {
        treatment: "Cancer Treatment",
        icon: Activity,
        india: {
            advantages: [
                "Comprehensive cancer care programs",
                "Advanced radiation therapy",
                "Precision oncology treatments",
                "Multidisciplinary cancer teams",
                "Affordable cancer medications",
                "Holistic cancer support services"
            ],
            facilities: [
                "400+ cancer treatment centers",
                "Advanced radiation therapy units",
                "Chemotherapy day care centers",
                "Bone marrow transplant units",
                "Cancer research institutes",
                "Palliative care facilities"
            ],
            specialFeatures: [
                "Immunotherapy programs",
                "Targeted cancer therapy",
                "Precision medicine approach",
                "Integrative cancer care"
            ]
        },
        others: [
            {
                country: "Canada",
                flag: "🇨🇦",
                advantages: [
                    "Universal healthcare coverage",
                    "Advanced cancer research",
                    "Quality treatment protocols",
                    "Comprehensive cancer centers"
                ],
                facilities: [
                    "Provincial cancer centers",
                    "Research hospitals",
                    "Radiation therapy centers",
                    "Clinical trial facilities"
                ],
                limitations: [
                    "Long treatment waiting times",
                    "Limited private options",
                    "Geographic accessibility issues",
                    "Cold climate challenges"
                ]
            },
            {
                country: "France",
                flag: "🇫🇷",
                advantages: [
                    "Excellent healthcare system",
                    "Advanced cancer treatments",
                    "Research-based protocols",
                    "Quality medical education"
                ],
                facilities: [
                    "Institut Curie cancer center",
                    "University cancer hospitals",
                    "Advanced treatment facilities",
                    "Research laboratories"
                ],
                limitations: [
                    "Language barriers for patients",
                    "Complex healthcare bureaucracy",
                    "High treatment costs",
                    "Limited English-speaking staff"
                ]
            }
        ]
    }
};

const CountryComparisonSection = () => {
    const [selectedTreatment, setSelectedTreatment] = useState('cardiac');
    const currentComparison = comparisons[selectedTreatment];

    const whyIndiaAdvantages = [
        {
            icon: Crown,
            title: "World-Class Medical Expertise",
            description: "Internationally trained doctors with decades of experience and global recognition",
            stats: "2,00+ qualified specialists"
        },
        {
            icon: Building,
            title: "State-of-the-Art Infrastructure",
            description: "JCI accredited hospitals with latest medical technology and international standards",
            stats: "500+ accredited hospitals"
        },
        {
            icon: Globe,
            title: "Global Medical Tourism Hub",
            description: "Seamless international patient services with dedicated care coordinators",
            stats: "2k+ international patients annually"
        },
        {
            icon: Users,
            title: "Multilingual Medical Staff",
            description: "English-speaking medical professionals ensuring clear communication",
            stats: "No language barriers"
        },
        {
            icon: Plane,
            title: "Complete Travel Support",
            description: "Visa assistance, airport transfers, accommodation, and family support services",
            stats: "End-to-end assistance"
        },
        {
            icon: Shield,
            title: "Quality & Safety Assurance",
            description: "International safety protocols and quality standards with proven track record",
            stats: "99.5% success rates"
        }
    ];

    return (
        <>
            <section className="bg-white reative py-10 ">
                {/* Background Elements */}
              
                <div className="container mx-auto px-0 relative">
                    {/* Header Section */}
                    <div className="text-center mb-6">


                        <h2 className="text-2xl md:text-4xl font-bold text-[#241d1f] mb-2 leading-snug">
                            India vs World: <span className="text-gray-900">Healthcare Excellence</span>
                        </h2>

                        <p className="text-xl text-[#241d1f] max-w-4xl mx-auto mb-4 leading-relaxed">
                            Discover why India has become the world's leading medical tourism destination, offering world-class healthcare
                            with unmatched expertise, advanced technology, and comprehensive patient care.
                        </p>

                      
                    </div>

                    {/* Treatment Selection */}
                    <div className="flex flex-wrap bg-gray-100 overflow-auto sticky top-0 py-6 bgite max-h-[200px] z-40 justify-center gap-4 mb-6">
                        {Object.entries(comparisons).map(([key, comparison]) => {
                            const IconComp = comparison.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedTreatment(key)}
                                    className={`group flex items-center space-x-3 px-8 py-2 rounded-xs font-medium  hover:shadow-sm ${selectedTreatment === key
                                        ? 'bg-[#e3232a] text-white shadow-gray-50 '
                                        : 'bg-white text-[#241d1f] hover:bg-white border-1 border-gray-50'
                                        }`}
                                >
                                    <IconComp className="h-6 w-6" />
                                    <span className="text-lg">{comparison.treatment}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Comparison Section */}
                    <div className="grid relative grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
                        {/* India Section */}
                        <div className="bg-red-50 rounded-xs p-8 text-[#241d1f] shadow-xs transform  transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="text-6xl">🇮🇳</div>
                                    <div>
                                        <h3 className="text-3xl font-bold">India</h3>
                                        <p className="text-[#241d1f]:">Global Healthcare Leader</p>
                                    </div>
                                </div>
                                <div className="bg-yellow-400 text-white mb-10 px-4 py-2 rounded-xs text-sm font-bold">
                                    RECOMMENDED
                                </div>
                            </div>

                            {/* Advantages */}
                            <div className="mb-8">
                                <h4 className="text-xl font-bold mb-4 flex items-center">
                                    <Crown className="h-6 w-6 mr-2" />
                                    Key Advantages
                                </h4>
                                <div className="space-y-3">
                                    {currentComparison.india.advantages.map((advantage, idx) => (
                                        <div key={idx} className="flex items-start space-x-3">
                                            <CheckCircle className="h-5 w-5 mt-0.5 text-[#76c147] flex-shrink-0" />
                                            <span className="text-[#241d1f]:">{advantage}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Facilities */}
                            <div className="mb-8">
                                <h4 className="text-xl font-bold mb-4 flex items-center">
                                    <Building className="h-6 w-6 mr-2" />
                                    World-Class Facilities
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {currentComparison.india.facilities.map((facility, idx) => (
                                        <div key={idx} className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
                                            <span className="text-[#241d1f] font-medium">{facility}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Special Features */}
                            {/* <div>
                                <h4 className="text-xl font-bold mb-4 flex items-center">
                                    <Sparkles className="h-6 w-6 mr-2" />
                                    Special Features
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentComparison.india.specialFeatures.map((feature, idx) => (
                                        <div key={idx} className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div> */}
                        </div>

                        {/* Other Countries Section */}
                      <div>
                          <div className="space-y-6 max-h-[800px] overflow-auto sticky top-20 ">
                            {currentComparison.others.map((country, idx) => (
                                <div key={idx} className="bg-white rounded-xs p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="text-4xl">{country.flag}</div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">{country.country}</h3>
                                            <p className="text-[#241d1f]">Alternative Destination</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Advantages */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                                <CheckCircle className="h-5 w-5 mr-2 text-[#76c147]" />
                                                Advantages
                                            </h4>
                                            <div className="space-y-2">
                                                {country.advantages.map((advantage, advIdx) => (
                                                    <div key={advIdx} className="flex items-start space-x-2">
                                                        <div className="w-2 h-2 bg-[#76c147] rounded-full mt-2 flex-shrink-0"></div>
                                                        <span className="text-sm text-[#241d1f]">{advantage}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Limitations */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                                <AlertTriangle className="h-5 w-5 mr-2 text-[#e32128]" />
                                                Considerations
                                            </h4>
                                            <div className="space-y-2">
                                                {country.limitations.map((limitation, limIdx) => (
                                                    <div key={limIdx} className="flex items-start space-x-2">
                                                        <div className="w-2 h-2 bg-[#e32128] rounded-full mt-2 flex-shrink-0"></div>
                                                        <span className="text-sm text-[#241d1f]">{limitation}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Why Choose India Section */}



                </div>
            </section>
            <section className='bg-gray-50 md:py-10 py-10'>
                <div className=" container mx-auto">
                    <div className="text-center mb-12">
                        <h3 className="text-4xl font-bold text-gray-900 mb-4">
                            Why India is the <span className="text-[#241d1f]">Smart Choice</span>
                        </h3>
                        <p className="text-xl text-[#241d1f] max-w-3xl mx-auto">
                            Beyond medical excellence, India offers comprehensive advantages that make it the preferred destination for international patients
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {whyIndiaAdvantages.map((advantage, index) => {
                            const IconComp = advantage.icon;
                            return (
                                <div
                                    key={index}
                                    className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-500 border border-gray-100 hover:border-red-200 transform "
                                >
                                    <div className="bg-gradient-to-r from-red-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6  transition-transform shadow-lg">
                                        <IconComp className="h-10 w-10 text-white" />
                                    </div>
                                    <h4 className="text-xl font-bold text-[#241d1f] mb-3 text-center ">
                                        {advantage.title}
                                    </h4>
                                    <p className="text-[#241d1f] text-center leading-relaxed mb-4">
                                        {advantage.description}
                                    </p>
                                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-3 text-center">
                                        <span className="text-gray-900 font-medium text-base">{advantage.stats}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
};

export default CountryComparisonSection;