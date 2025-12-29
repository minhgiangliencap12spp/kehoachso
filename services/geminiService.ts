import { GoogleGenAI, Type } from "@google/genai";
import { PPCTEntry, EquipmentConfigEntry, TimetableEntry } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const parsePPCTFromText = async (text: string): Promise<PPCTEntry[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key chưa được cấu hình.");
  }

  const prompt = `
    Bạn là một trợ lý ảo hỗ trợ giáo viên. Nhiệm vụ của bạn là trích xuất thông tin "Phân Phối Chương Trình" (PPCT) từ văn bản thô bên dưới.
    
    Hãy tìm các cặp dữ liệu: "Số tiết" (hoặc tiết số mấy) và "Tên bài học".
    Nếu văn bản có thông tin môn học hoặc khối lớp, hãy cố gắng trích xuất.
    
    Văn bản nguồn:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              lessonNumber: { type: Type.STRING, description: "Số thứ tự của tiết học (VD: 1, 2, 3...)" },
              lessonName: { type: Type.STRING, description: "Tên bài học tương ứng" },
              subject: { type: Type.STRING, description: "Tên môn học (nếu có)" },
              grade: { type: Type.STRING, description: "Khối lớp (nếu có)" }
            },
            required: ["lessonNumber", "lessonName"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PPCTEntry[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("Không thể phân tích dữ liệu bằng AI. Vui lòng kiểm tra lại văn bản hoặc thử lại sau.");
  }
};

export const parseEquipmentConfigFromText = async (text: string): Promise<EquipmentConfigEntry[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key chưa được cấu hình.");
  }

  const prompt = `
    Bạn là một trợ lý ảo hỗ trợ giáo viên. Nhiệm vụ của bạn là trích xuất thông tin "Danh Mục Thiết Bị Dạy Học" từ văn bản thô.
    
    Yêu cầu quan trọng:
    1. Tìm Số tiết (PPCT) và Tên thiết bị.
    2. Nếu một tiết học sử dụng nhiều thiết bị, hãy GỘP chúng vào cùng một mục, ngăn cách tên các thiết bị bằng dấu phẩy (Ví dụ: "Máy chiếu, Thước thẳng, Tranh minh họa").
    3. Không tạo nhiều dòng cho cùng một số tiết.
    
    Văn bản nguồn:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              lessonNumber: { type: Type.STRING, description: "Số thứ tự tiết học (VD: 1, 2, 3...)" },
              equipmentName: { type: Type.STRING, description: "Tên các thiết bị, ngăn cách bằng dấu phẩy (VD: Máy chiếu, Loa)" },
              quantity: { type: Type.STRING, description: "Số lượng (VD: 1 bộ, 1 cái...)" },
              subject: { type: Type.STRING, description: "Tên môn học (nếu có)" }
            },
            required: ["lessonNumber", "equipmentName"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as EquipmentConfigEntry[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("Không thể phân tích dữ liệu bằng AI.");
  }
};

export const parseTimetableFromText = async (text: string): Promise<TimetableEntry[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key chưa được cấu hình.");
  }

  const prompt = `
    Bạn là một trợ lý nhập liệu thông minh. Nhiệm vụ: Trích xuất Thời Khóa Biểu từ văn bản thô (CSV/Excel text).

    *** QUY TẮC QUAN TRỌNG VỀ SÁNG / CHIỀU ***
    Hệ thống sử dụng thang tiết từ 1 đến 10.
    1. **Buổi Sáng (Sáng):** Các tiết thường được đánh số 1, 2, 3, 4, 5. Giữ nguyên giá trị period.
    2. **Buổi Chiều (Chiều):** 
       - Nếu văn bản ghi "Chiều" hoặc nằm trong khu vực bảng buổi chiều, các tiết thường được đánh số lại là 1, 2, 3...
       - BẠN PHẢI QUY ĐỔI sang hệ thống chung bằng cách CỘNG THÊM 4 (hoặc 5 tùy ngữ cảnh, nhưng chuẩn là tiết 1 chiều = tiết 5 hệ thống).
       - Quy tắc ánh xạ:
         + Tiết 1 Chiều -> period: 5
         + Tiết 2 Chiều -> period: 6
         + Tiết 3 Chiều -> period: 7
         + Tiết 4 Chiều -> period: 8
         + Tiết 5 Chiều -> period: 9
    
    Dữ liệu cần trích xuất:
    - Thứ: Chuẩn hóa thành "Thứ 2", "Thứ 3", ..., "Thứ 7".
    - Tiết: Number (1-10) sau khi đã quy đổi Sáng/Chiều.
    - Môn học: Trích xuất chính xác tên môn (Ví dụ: "SHL", "Toán", "Chào cờ").
    - Lớp: Trích xuất tên lớp.
    - Giáo viên: Tên giáo viên (nếu có).

    Văn bản nguồn:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dayOfWeek: { type: Type.STRING, description: "Thứ (VD: Thứ 2, Thứ 3...)" },
              period: { type: Type.NUMBER, description: "Tiết thứ mấy (Đã quy đổi: Sáng 1-5, Chiều 5-10)" },
              subject: { type: Type.STRING, description: "Môn học (Giữ nguyên văn bản gốc)" },
              className: { type: Type.STRING, description: "Lớp học" },
              teacherName: { type: Type.STRING, description: "Tên giáo viên (nếu tìm thấy)" }
            },
            required: ["dayOfWeek", "period", "subject", "className"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TimetableEntry[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Timetable Text Error:", error);
    throw new Error("Không thể phân tích dữ liệu TKB từ văn bản.");
  }
};

export const parseTimetableFromImage = async (base64Image: string): Promise<TimetableEntry[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key chưa được cấu hình.");
  }

  // Extract base64 data and mime type
  const [header, data] = base64Image.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";

  const prompt = `
    Bạn là một trợ lý nhập liệu AI. Hãy nhìn vào hình ảnh Thời Khóa Biểu và trích xuất dữ liệu.
    
    *** QUY TẮC QUAN TRỌNG VỀ SÁNG / CHIỀU ***
    1. Xác định khu vực bảng là Sáng hay Chiều dựa trên tiêu đề hoặc ngữ cảnh.
    2. **Sáng:** Tiết 1, 2, 3, 4 -> Giữ nguyên (period 1-4).
    3. **Chiều:** 
       - Nếu thấy "Chiều", "Buổi Chiều" hoặc các tiết nằm ở phần dưới bảng được đánh số lại từ 1.
       - HÃY QUY ĐỔI: Tiết 1 chiều => period 5; Tiết 2 chiều => period 6; Tiết 3 chiều => period 7...
    
    Yêu cầu:
    - Trích xuất: Thứ (Thứ 2 - Thứ 7), Tiết (1-10 đã quy đổi), Môn học, Lớp, Tên Giáo Viên.
    - Tên môn học phải CHÍNH XÁC như trên hình ảnh.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dayOfWeek: { type: Type.STRING, description: "Thứ (VD: Thứ 2, Thứ 3...)" },
              period: { type: Type.NUMBER, description: "Tiết thứ mấy (Đã quy đổi hệ 10)" },
              subject: { type: Type.STRING, description: "Môn học (Chính xác như ảnh)" },
              className: { type: Type.STRING, description: "Lớp học" },
              teacherName: { type: Type.STRING, description: "Tên giáo viên" }
            },
            required: ["dayOfWeek", "period", "subject", "className"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TimetableEntry[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Timetable Image Error:", error);
    throw new Error("Không thể phân tích dữ liệu TKB từ hình ảnh.");
  }
};