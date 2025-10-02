"use client"
import { useRef, useState, useEffect } from "react"
import type React from "react"

import Matter from "matter-js"

interface FallingTextProps {
  text?: string
  highlightWords?: string[]
  trigger?: "auto" | "scroll" | "click" | "hover"
  backgroundColor?: string
  wireframes?: boolean
  gravity?: number
  mouseConstraintStiffness?: number
  fontSize?: string
}

const FallingText: React.FC<FallingTextProps> = ({
  text = "",
  highlightWords = [],
  trigger = "auto",
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
  fontSize = "1rem",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const overlayCleanupRef = useRef<(() => void) | null>(null)

  const [effectStarted, setEffectStarted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!textRef.current) return
    
    let words = text.split(" ")
    
    // Reduce words for mobile - keep only 5-6 words
    if (isMobile) {
      words = words.slice(0, 6)
    }

    const newHTML = words
      .map((word) => {
        const isHighlighted = highlightWords.some((hw) => word.startsWith(hw))
        return `<span
          class="inline-block mx-[2px] select-none text-white font-bold ${isHighlighted ? "text-cyan-500 font-bold" : ""}"
          style="text-shadow: 7px 12px 0 #000; font-family: var(--font-luckiest-guy), cursive; -webkit-text-stroke: 0.1px black;"
        >
          ${word}
        </span>`
      })
      .join(" ")

    textRef.current.innerHTML = newHTML
  }, [text, highlightWords, isMobile])

  useEffect(() => {
    if (trigger === "auto") {
      setEffectStarted(true)
      return
    }
    if (trigger === "scroll" && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEffectStarted(true)
            observer.disconnect()
          }
        },
        { threshold: 0.1 },
      )
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
  }, [trigger])

  useEffect(() => {
    if (!effectStarted) return

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter

    if (!containerRef.current || !canvasContainerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const width = containerRect.width
    const height = containerRect.height

    if (width <= 0 || height <= 0) return

    const engine = Engine.create()
    engine.world.gravity.y = gravity

    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: backgroundColor,
        wireframes,
      },
    })

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    }
    const floor = Bodies.rectangle(width / 2, height + 25, width, 50, boundaryOptions)
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions)
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions)
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions)

    if (!textRef.current) return
    const wordSpans = textRef.current.querySelectorAll("span")
    const wordBodies = [...wordSpans].map((elem) => {
      const rect = elem.getBoundingClientRect()

      const x = rect.left - containerRect.left + rect.width / 2
      const y = rect.top - containerRect.top + rect.height / 2

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: "transparent" },
        restitution: 0.8,
        frictionAir: 0.01,
        friction: 0.2,
      })
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 5,
        y: 0,
      })
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05)

      return { elem, body }
    })

    wordBodies.forEach(({ elem, body }) => {
      elem.style.position = "absolute"
      elem.style.left = `${body.position.x - body.bounds.max.x + body.bounds.min.x / 2}px`
      elem.style.top = `${body.position.y - body.bounds.max.y + body.bounds.min.y / 2}px`
      elem.style.transform = "none"
    })

    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
      },
    })

    // Fix scroll and interaction issues
    if (render.canvas) {
      // Make canvas not interfere with page scrolling
      render.canvas.style.pointerEvents = 'none'
      
      // Create invisible overlay for mouse interactions only
      const mouseOverlay = document.createElement('div')
      mouseOverlay.style.position = 'absolute'
      mouseOverlay.style.top = '0'
      mouseOverlay.style.left = '0'
      mouseOverlay.style.width = '100%'
      mouseOverlay.style.height = '100%'
      mouseOverlay.style.zIndex = '1'
      mouseOverlay.style.pointerEvents = 'auto'
      mouseOverlay.style.background = 'transparent'
      
      canvasContainerRef.current.appendChild(mouseOverlay)
      
      // Handle mouse events on overlay instead of canvas
      const handleMouseMove = (e: MouseEvent) => {
        const rect = mouseOverlay.getBoundingClientRect()
        mouse.position.x = e.clientX - rect.left
        mouse.position.y = e.clientY - rect.top
      }
      
      const handleMouseDown = (e: MouseEvent) => {
        const rect = mouseOverlay.getBoundingClientRect()
        mouse.position.x = e.clientX - rect.left
        mouse.position.y = e.clientY - rect.top
        mouse.button = 0
        mouseConstraint.mouse.button = 0
      }
      
      const handleMouseUp = () => {
        mouse.button = -1
        mouseConstraint.mouse.button = -1
      }
      
      mouseOverlay.addEventListener('mousemove', handleMouseMove)
      mouseOverlay.addEventListener('mousedown', handleMouseDown)
      mouseOverlay.addEventListener('mouseup', handleMouseUp)
      
      // Cleanup function for overlay
      const cleanupOverlay = () => {
        mouseOverlay.removeEventListener('mousemove', handleMouseMove)
        mouseOverlay.removeEventListener('mousedown', handleMouseDown)
        mouseOverlay.removeEventListener('mouseup', handleMouseUp)
        if (canvasContainerRef.current && mouseOverlay.parentNode) {
          canvasContainerRef.current.removeChild(mouseOverlay)
        }
      }
      
      // Store cleanup function in ref
      overlayCleanupRef.current = cleanupOverlay
    }

    render.mouse = mouse

    World.add(engine.world, [floor, leftWall, rightWall, ceiling, mouseConstraint, ...wordBodies.map((wb) => wb.body)])

    const runner = Runner.create()
    Runner.run(runner, engine)
    Render.run(render)

    const updateLoop = () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position
        elem.style.left = `${x}px`
        elem.style.top = `${y}px`
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`
      })
      Matter.Engine.update(engine)
      requestAnimationFrame(updateLoop)
    }
    updateLoop()

    return () => {
      Render.stop(render)
      Runner.stop(runner)
      
      // Clean up overlay if it exists
      if (overlayCleanupRef.current) {
        overlayCleanupRef.current()
        overlayCleanupRef.current = null
      }
      
      if (render.canvas && canvasContainerRef.current) {
        canvasContainerRef.current.removeChild(render.canvas)
      }
      World.clear(engine.world, false)
      Engine.clear(engine)
    }
  }, [effectStarted, gravity, wireframes, backgroundColor, mouseConstraintStiffness])

  const handleTrigger = () => {
    if (!effectStarted && (trigger === "click" || trigger === "hover")) {
      setEffectStarted(true)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full text-center pt-4 overflow-hidden"
      onClick={trigger === "click" ? handleTrigger : undefined}
      onMouseEnter={trigger === "hover" ? handleTrigger : undefined}
      style={{ 
        pointerEvents: effectStarted ? "none" : "auto", // Allow interactions only before effect starts
        zIndex: effectStarted ? 10 : 1 // Lower z-index when not active
      }}
    >
      <div
        ref={textRef}
        className="inline-block"
        style={{
          fontSize,
          lineHeight: 1.4,
          fontFamily: "var(--font-luckiest-guy), cursive",
        }}
      />

      <div 
        className="absolute top-0 left-0" 
        ref={canvasContainerRef}
        style={{ 
          zIndex: effectStarted ? 5 : -1, // Behind other content initially
          pointerEvents: "none" // Canvas container doesn't block scrolling
        }} 
      />
    </div>
  )
}

export default FallingText