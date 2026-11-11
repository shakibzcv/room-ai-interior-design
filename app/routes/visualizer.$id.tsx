import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generate3DView } from '../../lib/ai.action';
import { Download, RefreshCcw, Share2, X, AlertCircle } from 'lucide-react';
import Logo from '../../components/Logo';
import Button from '../../components/ui/Button';
import { createProject, getProjectById } from '../../lib/puter.action';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const VisualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    initialImage?: string;
    initialRendered?: string | null;
    name?: string;
  } | null;

  const { userId } = useOutletContext<AuthContext>();

  const hasInitialGenerated = useRef(false);

  // Initialize from router state if available so user doesn't wait on remote worker
  const [project, setProject] = useState<DesignItem | null>(() => {
    if (id && locationState?.initialImage) {
      return {
        id,
        name: locationState.name || `Residence ${id}`,
        sourceImage: locationState.initialImage,
        renderedImage: locationState.initialRendered || undefined,
        timestamp: Date.now(),
      };
    }
    return null;
  });

  const [isProjectLoading, setIsProjectLoading] = useState(() => !locationState?.initialImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(
    () => locationState?.initialRendered || null
  );

  const handleBack = () => navigate('/');
  const handleExport = () => {
    if (!currentImage) return;

    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `roomify-${id || 'design'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runGeneration = useCallback(
    async (item: DesignItem) => {
      if (!id || !item.sourceImage) return;

      try {
        setIsProcessing(true);
        setErrorMessage(null);
        console.log('[RoomAI] Starting runGeneration for project:', id);
        const result = await generate3DView({ sourceImage: item.sourceImage });

        if (result.renderedImage) {
          console.log('[RoomAI] 3D View generated successfully! Displaying to user immediately.');
          setCurrentImage(result.renderedImage);

          const updatedItem = {
            ...item,
            renderedImage: result.renderedImage,
            renderedPath: result.renderedPath,
            timestamp: Date.now(),
            ownerId: item.ownerId ?? userId ?? null,
            isPublic: item.isPublic ?? false,
          };

          setProject(updatedItem);

          // Crucial: remove the overlay right now so the user can interact with their render
          setIsProcessing(false);

          // Persist project and host assets asynchronously in the background
          createProject({ item: updatedItem, visibility: 'private' })
            .then((saved) => {
              if (saved) {
                console.log('[RoomAI] Project saved in background to Puter KV/hosting.');
                setProject(saved);
              }
            })
            .catch((saveError) => {
              console.warn('[RoomAI] Background storage failed (view is still visible):', saveError);
            });

          return;
        } else {
          setErrorMessage('AI could not generate a 3D visualization. Please try again.');
        }
      } catch (error: any) {
        console.error('[RoomAI] Generation failed: ', error);
        const msg =
          error?.message ||
          error?.error?.message ||
          (typeof error === 'string' ? error : 'Generation failed. Make sure you are signed in to Puter.');
        setErrorMessage(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [id, userId]
  );

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      if (fetchedProject) {
        setProject(fetchedProject);
        if (fetchedProject.renderedImage) {
          setCurrentImage(fetchedProject.renderedImage);
        }
      }
      setIsProjectLoading(false);
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (isProjectLoading || hasInitialGenerated.current || !project?.sourceImage) return;

    if (project.renderedImage) {
      requestAnimationFrame(() => {
        setCurrentImage(project.renderedImage ?? null);
      });
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    requestAnimationFrame(() => {
      void runGeneration(project);
    });
  }, [project, isProjectLoading, runGeneration]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <Link to="/" className="brand">
          <Logo className="logo" />

          <span className="name">Room AI Interior Design</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
          <X className="icon" /> Exit Editor
        </Button>
      </nav>

      <section className="content">
        <div className="viewport">
          <div className={`panel ${isProcessing ? 'is-processing' : ''}`}>
            <div className="panel-header">
              <h3>AI Rendering</h3>
              {isProcessing && <div className="hint animate-pulse">Processing...</div>}
            </div>

            <div className="render-area">
              {currentImage ? (
                <img src={currentImage} alt="AI Render" className="render-img" />
              ) : (
                <div className="render-placeholder">
                  {project?.sourceImage && (
                    <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                  )}
                </div>
              )}

              {errorMessage && !isProcessing && (
                <div className="render-overlay">
                  <div className="rendering-card border-red-500/40 bg-zinc-950/90 max-w-sm text-center p-6">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <span className="title text-red-200 text-base font-semibold">Generation Failed</span>
                    <span className="subtitle text-zinc-400 text-xs mt-1 mb-4 block leading-relaxed">
                      {errorMessage}
                    </span>
                    {project && (
                      <Button
                        size="sm"
                        onClick={() => runGeneration(project)}
                        className="mx-auto"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Try Again
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="render-overlay">
                  <div className="rendering-card">
                    <RefreshCcw className="spinner" />
                    <span className="title">Rendering...</span>
                    <span className="subtitle">Generating your 3D visualization</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Comparison</h3>
              <div className="hint">Drag to compare before & after</div>
            </div>

            <div className="compare-stage">
              {project?.sourceImage && currentImage ? (
                <ReactCompareSlider
                  defaultValue={50}
                  style={{ width: '100%', height: 'auto' }}
                  itemOne={
                    <ReactCompareSliderImage
                      src={project?.sourceImage}
                      alt="before"
                      className="compare-img"
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={(currentImage || project?.renderedImage) as string}
                      alt="after"
                      className="compare-img"
                    />
                  }
                />
              ) : (
                <div className="compare-fallback">
                  {project?.sourceImage && (
                    <img src={project.sourceImage} alt="Before" className="compare-img" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-section">
            <span className="label">Project Details</span>
            <h2>{project?.name || `Residence ${id}`}</h2>
            <p className="note">
              Created by You &bull;{' '}
              {project ? new Date(project.timestamp).toLocaleDateString() : ''}
            </p>
          </div>

          <div className="sidebar-actions">
            {project && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => runGeneration(project)}
                className="w-full mb-2"
                disabled={isProcessing}
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Rendering...' : 'Re-render View'}
              </Button>
            )}
            <Button size="lg" onClick={handleExport} className="export" disabled={!currentImage}>
              <Download className="w-4 h-4 mr-2" /> Export Design
            </Button>
            <Button size="lg" onClick={() => {}} className="share">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>

          <div className="sidebar-section">
            <span className="label">Source Image</span>
            <div className="before-preview group">
              {project?.sourceImage && <img src={project.sourceImage} alt="Source" />}
              <div className="preview-label">Original</div>
            </div>
          </div>

          <div className="sidebar-section">
            <span className="label">Information</span>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This 3D visualization was generated using Room AI Interior Design 2.0. The AI analyzes
              the structural layout of your source image and applies realistic materials, lighting,
              and furniture mappings.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
};
export default VisualizerId;
