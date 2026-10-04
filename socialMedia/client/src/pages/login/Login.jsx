import { Link } from "react-router-dom";
import "./login.scss";

const Login = () => {
  return (
    <div className="login">
      <div className="card">
        <div className="left">
          <h1>Hello World.</h1>
          <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aspernatur deserunt totam iusto amet iste eveniet nemo dolores dicta, temporibus a, aperiam doloremque illo sit placeat ab modi voluptas tenetur dolorum.
          </p>
          <span>Don't you have an account?</span>
          <Link to="/register">
            <button>
              Register
            </button>
          </Link>

        </div>
        <div className="right">
          <h1>Login</h1>
          <form>
            <input
              type="text"
              placeholder="Username"
              name="username" />
            <input type="text"
              name="password"
              placeholder="password" />

            <button>Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login;