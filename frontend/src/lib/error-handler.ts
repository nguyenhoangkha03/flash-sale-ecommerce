import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Check status code
    switch (axiosError.response?.status) {
      case 401:
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền truy cập tài nguyên này.';
      case 404:
        return 'Không tìm thấy tài nguyên.';
      case 400:
        return axiosError.response?.data?.message || 'Yêu cầu không hợp lệ.';
      case 409:
        return axiosError.response?.data?.message || 'Conflict. Vui lòng thử lại.';
      case 500:
      case 502:
      case 503:
        return 'Lỗi máy chủ. Vui lòng thử lại sau.';
      default:
        return axiosError.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Có lỗi không mong muốn xảy ra.';
};

export const handle401Error = (router: any) => {
  // Clear token
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
  
  // Redirect to login
  router.push('/login');
};
