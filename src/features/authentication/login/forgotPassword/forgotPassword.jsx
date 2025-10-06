import React from 'react';
import eyeIcon from '../../../../assets/images/eye-icon-open.svg';
import companyLogo from '../../../../assets/images/Evoke_technologies_logo-new-cropped-b&w.svg'
import leftImg from '../../../../assets/images/login-left-img.png';
import { useNavigate } from 'react-router-dom';
import { PasswordSchema } from './forgotPasswordForm';
import { useFormik } from 'formik';
import { useState } from "react";

function ForgotPassword() {
    const navigate = useNavigate();
    const baseURL = process.env.REACT_APP_BASE_URL;
    const [passwordVisibility, setPasswordVisibility] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });
    const togglePasswordVisibility = (field) => {
        setPasswordVisibility(prevState => ({
            ...prevState,
            [field]: !prevState[field]
        }));
    };

    const formik = useFormik({
        initialValues:{
            email:'',
            currentPassword:'',
            newPassword:'',
            confirmPassword:''
        },
        validationSchema:PasswordSchema,
        onSubmit:(values,{resetForm})=>{
            console.log(values, 'forgotPassword');
        }

    });
    return (
        <div className="container-fluid p-0">
            <div className="row m-0">
                <div className="col-md-6 p-0">
                    <div className="login-left pos-rel">
                        <img className="login-left-banner-img" src={leftImg} alt="Login Banner" />
                        <div className="login-logo">
                            <img src={companyLogo} alt="Logo" />
                        </div>
                        <div className="login-banner-content">
                            <h2 className="login-banner-head">
                                QA Accelerator
                            </h2>
                            <h5>
                                <i>AI Meets QA - Faster, Smarter, Better</i>
                            </h5>
                            <p className="login-banner-desc">
                                <i>
                                Supercharge your testing with seamless automation. Deliver faster, smarter and effortlessly with QA Accelerator!
                                </i>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 p-0">
                    <div className="card login-card">
                        <div className="login-form">
                            <h3>Forgot Password</h3>
                            <p>Please re-create your password.</p>
                            <form onSubmit={formik.handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            {/* <input className="form-control" type="email" id="email" /> */}
                                               <input
                                            className={formik.touched.email && formik.errors.email ? 'validation-fields form-control':'form-control'}
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formik.values.email}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                        {formik.touched.email && formik.errors.email ? (
                                            <div className="error">{formik.errors.email}</div>
                                        ) : null}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group pos-rel">
                                            <label htmlFor="currentpwd">Current Password</label>
                                            {/* <input className="form-control" type="password" id="currentpwd" /> */}
                                               <input
                                            className={formik.touched.currentPassword && formik.errors.currentPassword ? 'validation-fields form-control':'form-control'}
                                            type={passwordVisibility.currentPassword ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            placeholder="Current Password"
                                            value={formik.values.currentPassword}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                        {formik.touched.currentPassword && formik.errors.currentPassword ? (
                                            <div className="error">{formik.errors.currentPassword}</div>
                                        ) : null}
                                            <span className={`eye-icon ${passwordVisibility.currentPassword ? 'eye-icon-slash' : ''}`} onClick={() => togglePasswordVisibility('currentPassword')}>
                                                <img src={eyeIcon} alt="Toggle Visibility" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group pos-rel">
                                            <label htmlFor="newpwd">New Password</label>
                                            {/* <input className="form-control" type="password" id="newpwd" /> */}
                                            <input
                                            className={formik.touched.newPassword && formik.errors.newPassword ? 'validation-fields form-control':'form-control'}
                                            type={passwordVisibility.newPassword ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            placeholder="New Password"
                                            value={formik.values.newPassword}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                        {formik.touched.newPassword && formik.errors.newPassword ? (
                                            <div className="error">{formik.errors.newPassword}</div>
                                        ) : null}
                                            <span className={`eye-icon ${passwordVisibility.newPassword ? 'eye-icon-slash' : ''}`} onClick={() => togglePasswordVisibility('newPassword')}>
                                                <img src={eyeIcon} alt="Toggle Visibility" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group pos-rel">
                                            <label htmlFor="conpwd">Confirm Password</label>
                                            {/* <input className="form-control" type="password" id="conpwd" /> */}
                                            <input
                                            className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'validation-fields form-control':'form-control'}
                                            type={passwordVisibility.confirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Confirm Password"
                                            value={formik.values.confirmPassword}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                        {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                                            <div className="error">{formik.errors.confirmPassword}</div>
                                        ) : null}
                                            <span className={`eye-icon ${passwordVisibility.confirmPassword ? 'eye-icon-slash' : ''}`} onClick={() => togglePasswordVisibility('confirmPassword')}>
                                                <img src={eyeIcon} alt="Toggle Visibility" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 mt-4">
                                    <div className="form-group">
                                        <button className="btn btn-primary w-100" type="submit">Submit</button>
                                    </div>
                                    <div className="text-center">
                                        {/* <p className="mb-0">If you have an account? <a href="./login.html">Login</a></p> */}
                                        <p className="mb-0">If you have an account? <button className='cred-link' onClick={()=>{navigate(baseURL)}}>Login</button></p>

                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
