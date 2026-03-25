import type { PublicBookingSubmissionInput } from "@boat/validation";

export type BookingSubmissionFieldErrors = Partial<
  Record<keyof PublicBookingSubmissionInput, string[]>
>;

export type BookingSubmissionState =
  | {
      status: "idle";
      message: null;
      fieldErrors: BookingSubmissionFieldErrors;
      bookingId: null;
    }
  | {
      status: "validation_error" | "conflict" | "error";
      message: string;
      fieldErrors: BookingSubmissionFieldErrors;
      bookingId: null;
    }
  | {
      status: "success";
      message: string;
      fieldErrors: BookingSubmissionFieldErrors;
      bookingId: string;
    };

export const initialBookingSubmissionState: BookingSubmissionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  bookingId: null
};
