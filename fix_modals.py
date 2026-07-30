with open('session-book.html', 'r') as f:
    lines = f.readlines()

# Modals are lines 113 to 289 (0-indexed 112 to 289)
# Wait, let's just find the indices dynamically.
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "<!-- Form Builder Modal -->" in line:
        start_idx = i
    if "id=\"bcba-graph-modal-overlay\"" in line:
        # The modal ends 14 lines after this (275 to 289)
        pass
    if "<!-- end .main-viewport-slider -->" in line:
        end_idx = i - 2 # The div closing the pane

if start_idx != -1 and end_idx != -1:
    modals = lines[start_idx:end_idx] # from start_idx up to end_idx-1
    new_lines = lines[:start_idx] + lines[end_idx:]
    
    # insert before </main>
    main_end = -1
    for i, line in enumerate(new_lines):
        if "</main>" in line:
            main_end = i
            break
            
    if main_end != -1:
        final_lines = new_lines[:main_end] + modals + new_lines[main_end:]
        with open('session-book.html', 'w') as f:
            f.writelines(final_lines)
        print("Moved successfully")
    else:
        print("No </main>")
else:
    print("Indices not found")
