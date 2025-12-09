import { GoogleGenAI, Type } from "@google/genai";
import { TelemetryData, DiagnosticsReport, SystemStatus } from "../types";

export const generateDiagnostics = async (
  telemetry: TelemetryData
): Promise<DiagnosticsReport> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert industrial control systems technician. 
    Analyze the following telemetry snapshot from Power Distribution Unit #01.
    
    Telemetry Data:
    - Voltage: ${telemetry.voltage.toFixed(2)} V
    - Current: ${telemetry.current.toFixed(2)} A
    - Power: ${telemetry.power.toFixed(2)} W
    - Temperature: ${telemetry.temperature.toFixed(2)} °C
    - Frequency: ${telemetry.frequency.toFixed(2)} Hz
    - Efficiency: ${telemetry.efficiency.toFixed(1)} %
    
    Provide a technical status report.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              enum: ["NOMINAL", "WARNING", "CRITICAL"],
              description: "The overall system status based on thresholds.",
            },
            analysis: {
              type: Type.STRING,
              description: "A brief technical analysis of the metrics.",
            },
            recommendation: {
              type: Type.STRING,
              description: "Actionable steps for the operator.",
            },
            estimatedTimeUntilFailure: {
                type: Type.STRING,
                description: "Estimated time until critical failure if issues persist, or 'N/A' if nominal."
            }
          },
          required: ["status", "analysis", "recommendation", "estimatedTimeUntilFailure"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const data = JSON.parse(jsonText);

    return {
      status: data.status as SystemStatus,
      analysis: data.analysis,
      recommendation: data.recommendation,
      estimatedTimeUntilFailure: data.estimatedTimeUntilFailure,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      status: SystemStatus.WARNING,
      analysis: "Automated diagnostics failed. Connection error.",
      recommendation: "Check network connection and retry.",
      estimatedTimeUntilFailure: "Unknown"
    };
  }
};