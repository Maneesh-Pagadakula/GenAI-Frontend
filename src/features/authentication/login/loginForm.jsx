import * as Yup from "yup";

export const LoginSchema = Yup.object({
  email: Yup.string().email("Invalid Email Address").required("Email Required"),
  password: Yup.string()
    .required("Password Required")
    .max(8, "Must be 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password should be eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});
