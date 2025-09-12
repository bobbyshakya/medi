// "use client";
// import React, { useState } from 'react';
// import {
//   Star,
//   Phone,
//   Calendar,
//   Clock,
//   Heart,
//   CheckCircle,
//   GraduationCap,
//   Stethoscope,
//   Languages,
//   Building2,
//   Trophy,
// } from 'lucide-react';
// import { mockDoctor } from '@/data/doctordata';
// import { Button } from './ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// export default function DoctorProfileComponent() {
//   const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
//   const [isAboutExpanded, setIsAboutExpanded] = useState(false);

//   const toggleFaq = (index: number) => {
//     setExpandedFaq(expandedFaq === index ? null : index);
//   };

//   const toggleAbout = () => {
//     setIsAboutExpanded(!isAboutExpanded);
//   };

//   const doctor = mockDoctor;

//   const aboutText = doctor.about.split('\n');
//   const initialAbout = aboutText.slice(0, 1).join(' ');
//   const fullAbout = aboutText.join('\n');

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Hero Section */}
//       <div className="bg-white pt-8 pb-12">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//             {/* Doctor Photo - Made sticky when about is expanded */}
//             <div className="lg:col-span-1 h-full">
//               <div className="relative lg:sticky md:top-24 transition-all duration-300">
//                 <img
//                   src={doctor.photo}
//                   alt={doctor.name}
//                   className="w-full max-w-md mx-auto rounded-lg object-cover shadow-sm border border-gray-100"
//                 />
//               </div>
//             </div>

//             {/* Doctor Info */}
//             <div className="lg:col-span-2">
//               <div className="space-y-5">
//                 <div>
//                   <h1 className="text-4xl font-medium text-gray-900 mb-2 text-balance">{doctor.name}</h1>
//                   <p className="text-xl text-gray-700 font-semibold mb-2">{doctor.title}</p>
//                   <div className="flex flex-wrap items-center gap-2 mb-4">
                  
//                     <div className="flex bg-gray-50 p-2 px-4 items-center text-gray-600 rounded-md">
//                       <Clock className="w-5 h-5 mr-1" />
//                       <span>{doctor.experience} years experience</span>
//                     </div>
//                   </div>
//                   <div className="space-y-3 mb-6">
//                     <div className="flex items-center text-gray-600">
//                       <Languages className="w-5 h-5 mr-2" />
//                       <span>Languages: {doctor.languages.join(", ")}</span>
//                     </div>
//                     <div className="flex items-start text-gray-600">
//                       <Building2 className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
//                       <div>
//                         {doctor.hospitals.map((hospital, index) => (
//                           <div key={index}>{hospital}</div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-gray-900 text-lg leading-relaxed">
//                   <p className="whitespace-pre-line">{isAboutExpanded ? fullAbout : initialAbout}</p>
//                   <Button
//                     onClick={toggleAbout}
//                     variant="link"
//                     className="p-0 h-auto text-[#74BF44] hover:text-[#5fa335] font-semibold mt-2"
//                   >
//                     {isAboutExpanded ? "Read Less" : "Read More"}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <section className="py-12 px-4 bg-gray-50 lg:px-0">
//         <div className="container mx-auto">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Left Column - Main Content */}
//             <div className="lg:col-span-2 space-y-8">
//               {/* Experience */}
//               <Card className="border shadow-sm border-gray-100 bg-white">
//                 <CardHeader>
//                   <CardTitle className="text-3xl font-bold text-gray-700 flex items-center">
//                     <Stethoscope className="w-10 h-10 mr-2 text-gray-700" />
//                     Professional Experience
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   {doctor.workExperience.map((exp, index) => (
//                     <div key={index} className="rounded-lg p-4 bg-gray-50 shadow-sm border border-gray-100">
//                       <h3 className="text-xl font-medium text-gray-700">{exp.position}</h3>
//                       <p className="text-gray-600 mt-1 text-base">{exp.organization} ({exp.period})</p>
//                     </div>
//                   ))}
//                 </CardContent>
//               </Card>

//               {/* Education */}
//               <Card className="border shadow-sm border-gray-100 bg-white">
//                 <CardHeader>
//                   <CardTitle className="text-3xl font-bold text-gray-700 flex items-center">
//                     <GraduationCap className="w-10 h-10 mr-2 text-gray-700" />
//                     Education & Training
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   {doctor.education.map((edu, index) => (
//                     <div key={index} className="rounded-lg p-4 bg-gray-50 shadow-sm border border-gray-100">
//                       <h3 className="text-xl font-medium text-gray-700">{edu.degree}</h3>
//                       <p className="text-gray-600 mt-1 text-base">{edu.institution} {edu.year && `(${edu.year})`}</p>
//                     </div>
//                   ))}
//                 </CardContent>
//               </Card>

//               {/* Awards */}
//               <Card className="border shadow-sm border-gray-100 bg-white">
//                 <CardHeader>
//                   <CardTitle className="text-3xl font-bold text-gray-700 flex items-center">
//                     <Trophy className="w-10 h-10 mr-2 text-gray-700" />
//                     Awards & Recognition
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   {doctor.awards.map((award, index) => (
//                     <div key={index} className="rounded-lg p-4 bg-gray-50 shadow-sm border border-gray-100">
//                       <h3 className="text-xl font-medium text-gray-700">{award.title}</h3>
//                       {award.organization && award.year && (
//                         <p className="text-gray-600 mt-1 text-base">{award.organization} ({award.year})</p>
//                       )}
//                     </div>
//                   ))}
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Right Column - Sidebar */}
//             <div className="lg:col-span-1 space-y-6">
//               {/* Specialty Interests */}
//               <Card className="border shadow-sm border-gray-100 bg-white">
//                 <CardHeader>
//                   <CardTitle className="text-2xl font-semibold text-gray-700">Specialty Interests</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   {doctor.specialtyInterests.map((interest, index) => (
//                     <div key={index} className="rounded-lg p-4 bg-gray-50 shadow-sm border border-gray-100">
//                       <div className="flex items-center space-x-2">
//                         <CheckCircle className="w-5 h-5 text-[#74BF44] flex-shrink-0" />
//                         <span className="text-gray-900">{interest}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </CardContent>
//               </Card>

//               {/* Contact Card */}
//               <Card className="bg-white border-gray-100 shadow-sm">
//                 <CardContent className="p-6 text-center">
//                   <Heart className="w-8 h-8 text-gray-700 mx-auto mb-3" />
//                   <h3 className="text-2xl font-bold text-gray-700 mb-2">Need Medical Consultation?</h3>
//                   <p className="text-gray-600 mb-4 text-lg">
//                     Book an appointment with Dr. Anant Kumar for expert urology care.
//                   </p>
//                   <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold py-3 mb-4">
//                     <Calendar className="w-6 h-6 mr-2" />
//                     Schedule Appointment
//                   </Button>
//                   <div className="mt-4 pt-4 border-t border-gray-200">
//                     <div className="flex items-center justify-center text-gray-600 text-lg">
//                       <Phone className="w-5 h-5 mr-2" />
//                       <span>{doctor.contactPhone}</span>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
