import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './MainPage.css';

const MainPage = () => {
  const contentRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Add smooth scrolling and animation effects when component mounts
    const items = document.querySelectorAll('.timeline-item');
    
    // Handle viewport resize
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use Intersection Observer for animation if supported
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
      
      items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(item);
      });

      // Clean up observer on unmount
      return () => {
        items.forEach(item => observer.unobserve(item));
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // Fallback for browsers without Intersection Observer
      items.forEach(item => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      });
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const takeScreenshot = async () => {
    if (contentRef.current) {
      try {
        setIsLoading(true);
        setLoadingMessage('Preparing to capture your infographic...');
        
        // First, check if the server is responding
        try {
          const healthResponse = await fetch('/health');
          if (!healthResponse.ok) {
            throw new Error('Server is not responding. Creating screenshot locally instead.');
          }
        } catch (error) {
          console.log('Server health check failed, falling back to client-side screenshot');
          // Fall back to client-side screenshot if server is not available
          await takeClientScreenshot();
          return;
        }
        
        setLoadingMessage('Creating your beautiful infographic... This may take a moment.');
        
        // Set a longer timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        try {
          const response = await fetch('/screenshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: window.location.href }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(`Server error: ${errorData.error} - ${errorData.details || ''}`);
            } else {
              const errorText = await response.text();
              throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
          }
          
          // Check content type
          const contentType = response.headers.get('Content-Type');
          if (!contentType || !contentType.includes('image/png')) {
            throw new Error(`Invalid response type: ${contentType}`);
          }
          
          // Get the blob
          const blob = await response.blob();
          
          if (blob.size < 1000) {
            // If the blob is too small, it's probably not a valid image
            throw new Error('Invalid screenshot response');
          }
          
          // Create download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pinterest-infographic-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          alert('Your infographic has been downloaded successfully!');
          
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Screenshot request timed out. Please try again later.');
          }
          // If server-side screenshot fails, fall back to client-side
          console.log('Server-side screenshot failed, falling back to client-side', fetchError);
          await takeClientScreenshot();
        }
      } catch (error) {
        console.error('Error taking screenshot:', error);
        alert(`Failed to take screenshot: ${error.message}`);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  // Fallback to client-side screenshot if server method fails
  const takeClientScreenshot = async () => {
    setLoadingMessage('Creating your infographic locally...');
    try {
      // Capture the content using html2canvas with better quality settings
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Enable CORS for images
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Convert canvas to a data URL
      const imageUrl = canvas.toDataURL('image/png');
      
      // Create a temporary link element to download the image
      const link = document.createElement('a');
      link.download = `pinterest-infographic-${new Date().toISOString().slice(0,10)}.png`;
      link.href = imageUrl;
      link.click();
    } catch (error) {
      console.error('Error taking client-side screenshot:', error);
      throw error;
    }
  };

  // Function to determine button text based on state and screen size
  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (viewportWidth < 576) return 'Download';
    return 'Download Infographic';
  };

  return (
    <div className="main-page">
      <div className="container" id="infographic" ref={contentRef}>
        <div className="header">
          <h1>Harnessing Infographics for<br/>Effective Pinterest Marketing</h1>
        </div>
        
        <div className="content">
          <div className="timeline">
            <div className="timeline-item">
              <div className="number">1</div>
              <div className="content-box">
                <div className="content-title">Enhancing Visual Appeal</div>
                <div className="content-text">
                  Infographics leverage visually appealing designs, which can capture users' attention quickly on Pinterest's image-centric platform. This visual aspect can lead to increased engagement and higher pin rates.
                </div>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="number">2</div>
              <div className="content-box">
                <div className="content-title">Simplifying Complex Information</div>
                <div className="content-text">
                  Infographics simplify complex data and concepts into digestible visual formats. This is particularly useful for e-commerce brands or service providers looking to explain products or services quickly.
                </div>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="number">3</div>
              <div className="content-box">
                <div className="content-title">Boosting Brand Awareness</div>
                <div className="content-text">
                  Consistent use of infographics helps in building brand identity. By using specific colors, fonts, and styles, brands can create a distinct visual language that resonates with users and enhances recall.
                </div>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="number">4</div>
              <div className="content-box">
                <div className="content-title">Encouraging Shares and Saves</div>
                <div className="content-text">
                  Infographics are highly shareable content; they encourage users to save, pin, or share them due to their informative nature. This can lead to organic reach and visibility on Pinterest.
                </div>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="number">5</div>
              <div className="content-box">
                <div className="content-title">Driving Traffic to Websites</div>
                <div className="content-text">
                  Infographics can include call-to-actions (CTAs) linking back to your website or landing page, facilitating the conversion of Pinterest users into website visitors, thus driving traffic effectively.
                </div>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="number">6</div>
              <div className="content-box">
                <div className="content-title">Leveraging SEO Benefits</div>
                <div className="content-text">
                  When properly tagged with keywords and descriptions, infographics can enhance SEO on Pinterest. This can improve discoverability, making it easier for users interested in specific topics to find your pins.
                </div>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="number">7</div>
              <div className="content-box">
                <div className="content-title">Creating Educational Content</div>
                <div className="content-text">
                  Infographics can serve as educational tools or tutorials, providing value to your audience. This type of informative content can establish authority in your niche and attract a loyal following.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed-screenshot-button">
        <button 
          className="screenshot-button" 
          onClick={takeScreenshot}
          disabled={isLoading}
        >
          {getButtonText()}
        </button>
        {isLoading && <div className="loading">{loadingMessage}</div>}
      </div>
    </div>
  );
};

export default MainPage;
