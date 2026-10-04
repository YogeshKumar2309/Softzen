import { Link } from "react-router-dom";
import "./register.scss"

const Register = () => {
  return (
    <div className="register">
      <div className="card">
        <div className="left">
          <h1>Welcome.</h1>
          <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aspernatur deserunt totam iusto amet iste eveniet nemo dolores dicta, temporibus a, aperiam doloremque illo sit placeat ab modi voluptas tenetur dolorum.
          </p>
          <span>I have already account</span>
          <Link to="/login">
            <button>
              Login
            </button>
          </Link>

        </div>
        <div className="right">
          <h1>Register</h1>

          <form>
            <input
              type="text"
              placeholder="Username"
              name="username" />
            <input
              type="email"
              placeholder="Email"
              name="email" />
            <input type="password"
              name="password"
              placeholder="password" />

            <button>Register</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register;