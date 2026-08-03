// src/lib/utils/validation.ts

/**
 * Heuristic pre-check: Validates student text inputs to prevent copy-paste abuse, 
 * prompt copying, and repetitive word spam before hitting the AI server.
 */
export function validateStudentInput(
  input: string,
  promptText: string = '',
  minWords: number = 30
): { isValid: boolean; feedback?: string } {
  const cleanInput = input.trim()
  
  if (!cleanInput) {
    return { isValid: false, feedback: 'Please write your response.' }
  }

  // 1. Basic Word Count Check
  const words = cleanInput.split(/\s+/).filter(w => w.length > 0)
  if (words.length < minWords) {
    return { 
      isValid: false, 
      feedback: `Your response is too short. Please write at least ${minWords} words (currently ${words.length}).` 
    }
  }

  // 2. Gibberish Check (e.g. "asdfasdfasdfasdfasdf")
  const hasExcessiveWordLength = words.some(w => w.length > 25)
  if (hasExcessiveWordLength) {
    return { 
      isValid: false, 
      feedback: 'Your response contains invalid words. Please write in complete, readable sentences.' 
    }
  }

  // 3. Lexical Diversity / Repetition Check (e.g. "word word word word...")
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')))
  const diversityRatio = uniqueWords.size / words.length

  // If the student writes more than 8 words, but uses less than 40% unique words, it is repetitive spam
  if (words.length > 8 && diversityRatio < 0.40) {
    return { 
      isValid: false, 
      feedback: 'Please write a complete explanation in your own words instead of repeating words.' 
    }
  }

  // 4. Prompt Copy-Paste Check
  if (promptText.trim()) {
    const normalizedPrompt = promptText.toLowerCase().replace(/[^\w\s]/g, '')
    const promptWords = new Set(
      normalizedPrompt.split(/\s+/).filter(w => w.length > 3) // Only evaluate meaningful words (length > 3)
    )

    if (promptWords.size > 0) {
      let matchedPromptWords = 0
      const inputWordsLower = words.map(w => w.toLowerCase().replace(/[^\w]/g, ''))
      
      inputWordsLower.forEach(word => {
        if (promptWords.has(word)) {
          matchedPromptWords++
        }
      })

      // If more than 75% of the words in the student's response are copied straight
      // from the prompt's own vocabulary, they have copied the question back to us.
      const overlapRatio = matchedPromptWords / words.length
      
      if (overlapRatio > 0.75 && words.length <= promptWords.size * 1.5) {
        return {
          isValid: false,
          feedback: 'It looks like you copied the question prompt. Please write your own original explanation.'
        }
      }
    }
  }

  return { isValid: true }
}

/**
 * Reusable React props to disable copying, highlighting, dragging, 
 * and right-clicking on sensitive educational content.
 */
export const copyProtectionProps = {
  className: "select-none cursor-default", // Tailwind CSS class to block highlighting & pointer selection
  onCopy: (e: React.ClipboardEvent) => e.preventDefault(), // Disable Ctrl+C / Cmd+C
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(), // Disable right-click menu
  onDragStart: (e: React.DragEvent) => e.preventDefault(), // Disable text dragging
}

