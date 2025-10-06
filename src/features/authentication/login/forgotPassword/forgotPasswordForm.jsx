import * as Yup from 'yup';


export const PasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid Email Address')
        .required('Email Required'),
    currentPassword: Yup.string()
        .required('Current Password Required'),
    newPassword: Yup.string()
        .required('New Password Required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password should be eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm Password Required')
});
