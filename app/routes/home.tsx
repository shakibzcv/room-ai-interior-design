import type { Route } from './+types/home';
import Navbar from '../../components/Navbar';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Layers,
  Trash2,
  Zap,
  Shield,
  Cpu,
  Sparkles,
  Check,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Upload from '../../components/Upload';
import Footer from '../../components/Footer';
import { useNavigate, useOutletContext } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { createProject, deleteProject, getProjects } from '../../lib/puter.action';

export function meta(_props: Route.MetaArgs) {
  return [
    { title: 'Room AI Interior Design' },
    {
      name: 'description',
      content: 'AI-first design environment for architectural visualization and room rendering.',
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const auth = useOutletContext<AuthContext>();
  const isSignedIn = auth?.isSignedIn ?? false;

  const [projects, setProjects] = useState<DesignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isCreatingProjectRef = useRef(false);

  const handleUploadComplete = async (base64Image: string) => {
    try {
      if (isCreatingProjectRef.current) return false;
      isCreatingProjectRef.current = true;
      const newId = Date.now().toString();
      const name = `Residence ${newId}`;

      const newItem = {
        id: newId,
        name,
        sourceImage: base64Image,
        renderedImage: undefined,
        timestamp: Date.now(),
      };

      const saved = await createProject({ item: newItem, visibility: 'private' });

      if (!saved) {
        console.error('Failed to create project');
        return false;
      }

      setProjects((prev) => [saved, ...prev]);

      navigate(`/visualizer/${newId}`, {
        state: {
          initialImage: saved.sourceImage,
          initialRendered: saved.renderedImage || null,
          name,
        },
      });

      return true;
    } finally {
      isCreatingProjectRef.current = false;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    const success = await deleteProject({ id });
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!isSignedIn) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const items = await getProjects();
      setProjects(items);
      setIsLoading(false);
    };

    fetchProjects();
  }, [isSignedIn]);

  return (
    <div className="home">
      <Navbar {...auth} />

      <section className="hero">
        <div className="hero-content">
          <div className="announce">
            <div className="dot">
              <div className="pulse"></div>
            </div>

            <p>Introducing Room AI Interior Design 2.0</p>
          </div>

          <h1>Build beautiful spaces at the speed of thought</h1>

          <p className="subtitle">
            Room AI Interior Design is an AI-first design environment that helps you visualize,
            render, and ship architectural projects faster than ever.
          </p>

          <div className="actions">
            <a href="#upload" className="cta">
              Start Building <ArrowRight className="icon" />
            </a>

            <Button variant="outline" size="lg" className="demo">
              Watch Demo
            </Button>
          </div>
        </div>

        <div id="upload" className="upload-shell">
          <div className="grid-overlay" />

          <div className="upload-card">
            <div className="upload-head">
              <div className="upload-icon">
                <Layers className="icon" />
              </div>

              <h3>Upload your floor plan</h3>
              <p>Supports JPG, PNG, formats up to 10MB</p>
            </div>

            <Upload onComplete={handleUploadComplete} />
          </div>
        </div>
      </section>

      <section id="gallery" className="projects">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>Projects</h2>
              <p>Your latest work and shared community projects, all in one place.</p>
            </div>
          </div>

          {!isLoading && projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Layers />
              </div>
              <h3>No projects yet</h3>
              <p>Upload a floor plan to start your first architectural visualization.</p>
              <a href="#upload" className="empty-cta">
                Get Started
              </a>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(({ id, name, renderedImage, sourceImage, timestamp, isPublic }) => (
                <div
                  key={id}
                  className="project-card group"
                  onClick={() => navigate(`/visualizer/${id}`)}
                >
                  <div className="preview">
                    <img src={renderedImage || sourceImage} alt="Project" />

                    <div className="badge">
                      <span>{isPublic ? 'Public' : 'Private'}</span>
                    </div>

                    <button
                      className="delete-btn"
                      onClick={(e) => handleDelete(e, id)}
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="card-body">
                    <div>
                      <h3>{name}</h3>

                      <div className="meta">
                        <Clock size={12} />
                        <span>{new Date(timestamp).toLocaleDateString()}</span>
                        <span>By You</span>
                      </div>
                    </div>
                    <div className="arrow">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="features" className="features">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <p className="overline">Capabilities</p>
              <h2>Design without limits</h2>
              <p>Everything you need to visualize architectural projects in record time.</p>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>Instant Rendering</h3>
              <p>
                Generate high-quality 3D visualizations from 2D floor plans in seconds, not hours.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Cpu />
              </div>
              <h3>AI-Powered</h3>
              <p>
                State-of-the-art Gemini models ensure your renders are realistic and aesthetically
                pleasing.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Secure & Private</h3>
              <p>
                Your designs are yours. Choose between private and public visibility for all your
                projects.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Sparkles />
              </div>
              <h3>Smart Detection</h3>
              <p>
                Automatically detects walls, furniture, and room layouts for accurate
                visualizations.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="pricing" className="pricing">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <p className="overline">Pricing</p>
              <h2>Simple, user-powered pricing</h2>
              <p>
                Built with Puter.js, meaning you only pay for what you use through your own account.
              </p>
            </div>
          </div>

          <div className="pricing-card">
            <div className="pricing-head">
              <h3>Personal</h3>
              <div className="price">
                <span className="amount">Puter-Powered</span>
              </div>
              <p>Use your existing Puter account resources for free AI rendering and storage.</p>
            </div>

            <ul className="pricing-features">
              <li>
                <Check size={16} /> Unlimited Projects
              </li>
              <li>
                <Check size={16} /> AI Renders (via User Account)
              </li>
              <li>
                <Check size={16} /> Private & Public Sharing
              </li>
              <li>
                <Check size={16} /> High-Resolution Exports
              </li>
              <li>
                <Check size={16} /> Puter Cloud Storage Integration
              </li>
            </ul>

            <Button
              size="lg"
              className="pricing-cta"
              onClick={() => (window.location.hash = 'upload')}
            >
              Start Rendering
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
