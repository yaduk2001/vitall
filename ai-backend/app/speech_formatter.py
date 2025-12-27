def format_script(section, micro_index, total_micro):
    """
    Creates a natural speech-friendly version of lesson content.
    """

    topic = section["topic"]
    sub = section["subtopic"]
    content = section["content"]

    # Intro transitions
    if micro_index == 0:
        spoken = f"📘 New topic: {topic}. Now focusing on: {sub}. Let's begin. "
    elif micro_index == total_micro - 1:
        spoken = f"Alright, final part of {sub}: "
    else:
        spoken = "Continuing: "

    spoken += content

    # Add pacing pauses for TTS
    return _tts_pacing(spoken)


def _tts_pacing(text: str) -> str:
    processed = text.replace(".", ". <break time='500ms'/>")
    return f"<speak>{processed}</speak>"
