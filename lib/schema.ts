import { z } from "zod"

export const doctorFormSchema = z.object({
  patientName: z.string().min(2, {
    message: "Patient name must be at least 2 characters.",
  }),
  age: z.string().min(1, {
    message: "Age is required.",
  }),
  gender: z.string().optional(),
  chiefComplaint: z.string().min(3, {
    message: "Chief complaint must be at least 3 characters.",
  }),
  symptoms: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
})

export type DoctorFormValues = z.infer<typeof doctorFormSchema>

export const substationInspectionSchema = z.object({
  inspectorName: z.string().min(2, {
    message: "Inspector name must be at least 2 characters.",
  }),
  dateTime: z.string().min(1, {
    message: "Date and time is required.",
  }),
  substationName: z.string().min(1, {
    message: "Substation name or ID is required.",
  }),
  weatherConditions: z.string().optional(),
  generalImpression: z.string().optional(),
  switchgearCondition: z.string().optional(),
  leaksRustOverheating: z.string().optional(),
  safetyEquipment: z.string().optional(),
  cleanlinessVegetation: z.string().optional(),
  securityStatus: z.string().optional(),
  unusualObservations: z.string().optional(),
  maintenanceActions: z.string().optional(),
  additionalRemarks: z.string().optional(),
  recommendations: z.string().optional(),
  inspectorSignature: z.string().optional(),
})

export type SubstationInspectionValues = z.infer<typeof substationInspectionSchema>
