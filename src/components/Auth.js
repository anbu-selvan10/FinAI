import '../styles/Auth.css'; // Import your CSS file
import logo from '../images/logo.jpg'

const Auth = () => {
    const handleSignUp = (event) => {
        event.preventDefault();
        // Your sign up logic here
    };

    const handleSignIn = (event) => {
        event.preventDefault();
        // Your sign in logic here
    };

    return (
        <div className="container" id="container">
            <div className="form-container sign-up">
                <img className="logo" src={logo} id="budglogo" />
                <form onSubmit={handleSignUp}>
                    <h1>Create Account</h1>
                    <div className="social-icons">
                        <a href="#" className="icon"><i className="fab fa-google-plus-g"></i></a>
                        <a href="#" className="icon"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" className="icon"><i className="fab fa-github"></i></a>
                        <a href="#" className="icon"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                    <span>or use your email for registration</span>
                    <input type="text" placeholder="Name" />
                    <input type="email" placeholder="Email" />
                    <input type="password" placeholder="Password" />
                    <button type="submit">Sign Up</button>
                </form>
            </div>
            <div className="form-container sign-in">
                <form onSubmit={handleSignIn}>
                    <h1>Sign In</h1>
                    <div className="social-icons">
                        <a href="#" className="icon"><i className="fab fa-google-plus-g"></i></a>
                        <a href="#" className="icon"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" className="icon"><i className="fab fa-github"></i></a>
                        <a href="#" className="icon"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                    <span>or use your email password</span>
                    <input type="email" placeholder="Email" />
                    <input type="password" placeholder="Password" />
                    <a href="#">Forget Your Password?</a>
                    <button type="submit">Sign In</button>
                </form>
            </div>
            <div className="toggle-container">
                <div className="toggle">
                    <div className="toggle-panel toggle-left">
                        <h1>Welcome Back!</h1>
                        <p>Enter your personal details to use all of site features</p>
                        <button className="hidden" id="login">Sign In</button>
                    </div>
                    <div className="toggle-panel toggle-right">
                        <h1>Greetings!</h1>
                        <p>Register with your personal details to use all of site features</p>
                        <button className="hidden" id="register">Sign Up</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;