import { z } from "zod"
import { doctorFormSchema, substationInspectionSchema } from "./schema"

export type FieldType = "text" | "textarea" | "anomaly-detector"

export interface FormField {
  name: string
  label: string
  placeholder: string
  type: FieldType
  required?: boolean
}

export interface DemoConfig {
  id: string
  title: string
  description: string
  icon: string
  formTitle: string
  submitButtonText: string
  schema: z.ZodObject<any>
  fields: FormField[]
  defaultValues: Record<string, string>
}

export const DEMOS: DemoConfig[] = [
  {
    id: "medical-intake",
    title: "Medical Intake",
    description: "Patient information capture",
    icon: "🏥",
    formTitle: "Patient Intake Form",
    submitButtonText: "Submit Patient Form",
    schema: doctorFormSchema,
    fields: [
      {
        name: "patientName",
        label: "Patient Name *",
        placeholder: "John Doe",
        type: "text",
        required: true,
      },
      {
        name: "age",
        label: "Age *",
        placeholder: "35",
        type: "text",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        placeholder: "Male/Female/Other",
        type: "text",
      },
      {
        name: "chiefComplaint",
        label: "Chief Complaint *",
        placeholder: "Headache",
        type: "text",
        required: true,
      },
      {
        name: "symptoms",
        label: "Symptoms",
        placeholder: "Describe symptoms...",
        type: "textarea",
      },
      {
        name: "medicalHistory",
        label: "Medical History",
        placeholder: "Past medical conditions...",
        type: "textarea",
      },
      {
        name: "allergies",
        label: "Allergies",
        placeholder: "Known allergies...",
        type: "textarea",
      },
      {
        name: "currentMedications",
        label: "Current Medications",
        placeholder: "Current medications...",
        type: "textarea",
      },
    ],
    defaultValues: {
      patientName: "",
      age: "",
      gender: "",
      chiefComplaint: "",
      symptoms: "",
      medicalHistory: "",
      allergies: "",
      currentMedications: "",
    },
  },
  {
    id: "substation-inspection",
    title: "Substation Inspection",
    description: "Routine inspection form",
    icon: "⚡",
    formTitle: "Substation Routine Inspection Form",
    submitButtonText: "Submit Inspection Report",
    schema: substationInspectionSchema,
    fields: [
      {
        name: "inspectorName",
        label: "Inspector Name *",
        placeholder: "John Smith",
        type: "text",
        required: true,
      },
      {
        name: "dateTime",
        label: "Date and Time *",
        placeholder: "2025-10-10 14:30",
        type: "text",
        required: true,
      },
      {
        name: "substationName",
        label: "Substation Name/ID *",
        placeholder: "Station Alpha-01",
        type: "text",
        required: true,
      },
      {
        name: "weatherConditions",
        label: "Weather Conditions",
        placeholder: "Clear, temperature 72°F",
        type: "text",
      },
      {
        name: "generalImpression",
        label: "General Visual Impression",
        placeholder: "Overall site condition...",
        type: "textarea",
      },
      {
        name: "switchgearCondition",
        label: "Switchgear and Transformers",
        placeholder: "Condition of equipment...",
        type: "textarea",
      },
      {
        name: "leaksRustOverheating",
        label: "Oil Leaks, Rust, or Overheating",
        placeholder: "Signs observed...",
        type: "textarea",
      },
      {
        name: "safetyEquipment",
        label: "Safety Equipment and Signage",
        placeholder: "Status of safety equipment...",
        type: "textarea",
      },
      {
        name: "cleanlinessVegetation",
        label: "Cleanliness and Vegetation Control",
        placeholder: "Site cleanliness status...",
        type: "textarea",
      },
      {
        name: "securityStatus",
        label: "Security Status",
        placeholder: "Fences, locks, access control...",
        type: "textarea",
      },
      {
        name: "unusualObservations",
        label: "Unusual Noises, Smells, or Vibrations",
        placeholder: "Any abnormal observations...",
        type: "textarea",
      },
      {
        name: "imageAnomalyDetection",
        label: "Image Anomaly Detection",
        placeholder: "Upload inspection photos...",
        type: "anomaly-detector",
      },
      {
        name: "maintenanceActions",
        label: "Maintenance/Corrective Actions",
        placeholder: "Actions performed...",
        type: "textarea",
      },
      {
        name: "additionalRemarks",
        label: "Additional Observations",
        placeholder: "Other remarks...",
        type: "textarea",
      },
      {
        name: "recommendations",
        label: "Recommendations",
        placeholder: "Follow-up or repair recommendations...",
        type: "textarea",
      },
      {
        name: "inspectorSignature",
        label: "Inspector Signature/Initials",
        placeholder: "J.S.",
        type: "text",
      },
    ],
    defaultValues: {
      inspectorName: "",
      dateTime: "",
      substationName: "",
      weatherConditions: "",
      generalImpression: "",
      switchgearCondition: "",
      leaksRustOverheating: "",
      safetyEquipment: "",
      cleanlinessVegetation: "",
      securityStatus: "",
      unusualObservations: "",
      imageAnomalyDetection: "",
      maintenanceActions: "",
      additionalRemarks: "",
      recommendations: "",
      inspectorSignature: "",
    },
  },
]
