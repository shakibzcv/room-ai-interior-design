import { useNavigate, useOutletContext, useParams } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generate3DView } from '../../lib/ai.action';
import { Download, RefreshCcw, Share2, X } from 'lucide-react';
import Logo from '../../components/Logo';
import Button from '../../components/ui/Button';
import { createProject, getProjectById } from '../../lib/puter.action';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const VisualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useOutletContext<AuthContext>();

  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

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
        const result = await generate3DView({ sourceImage: item.sourceImage });

        if (result.renderedImage) {
          setCurrentImage(result.renderedImage);

          const updatedItem = {
            ...item,
            renderedImage: result.renderedImage,
            renderedPath: result.renderedPath,
            timestamp: Date.now(),
            ownerId: item.ownerId ?? userId ?? null,
            isPublic: item.isPublic ?? false,
          };

          const saved = await createProject({ item: updatedItem, visibility: 'private' });

          if (saved) {
            setProject(saved);
            setCurrentImage(saved.renderedImage || result.renderedImage);
          }
        }
      } catch (error) {
        console.error('Generation failed: ', error);
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

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
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
        <div className="brand">
          <Logo className="logo" />

          <span className="name">Room AI Interior Design</span>
        </div>
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
