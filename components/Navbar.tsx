import Logo from './Logo';
import Button from './ui/Button';
import { Link, useOutletContext } from 'react-router';

interface NavbarProps {
  isSignedIn?: boolean;
  userName?: string | null;
  signIn?: () => Promise<boolean>;
  signOut?: () => Promise<boolean>;
}

const Navbar = (props: NavbarProps = {}) => {
  const context = useOutletContext<AuthContext>() || {};
  const isSignedIn = props.isSignedIn ?? context.isSignedIn ?? false;
  const userName = props.userName !== undefined ? props.userName : context.userName;
  const signIn = props.signIn ?? context.signIn;
  const signOut = props.signOut ?? context.signOut;

  const handleAuthClick = async () => {
    if (isSignedIn) {
      try {
        if (signOut) await signOut();
      } catch (e) {
        console.error(`Puter sign out failed: ${e}`);
      }

      return;
    }

    try {
      if (signIn) await signIn();
    } catch (e) {
      console.error(`Puter sign in failed: ${e}`);
    }
  };

  return (
    <header className="navbar">
      <nav className="inner">
        <div className="left">
          <Link to="/" className="brand">
            <Logo className="logo" />

            <span className="name">Room AI</span>
          </Link>

          <ul className="links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#gallery">Gallery</a>
            <a href="#">About</a>
          </ul>
        </div>

        <div className="actions">
          {isSignedIn ? (
            <>
              <span className="greeting">{userName ? `Hi, ${userName}` : 'Signed in'}</span>

              <Button size="sm" onClick={handleAuthClick} className="btn">
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleAuthClick} size="sm" variant="ghost">
                Log In
              </Button>

              <a href="#upload" className="cta">
                Get Started
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
