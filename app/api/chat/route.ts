import { NextRequest, NextResponse } from 'next/server';

interface Call {
  id: string;
  clientName: string;
  phoneNumber: string;
  scheduledTime: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'missed' | 'in-progress';
  notes: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, calls, chatHistory } = await req.json();

    // AI Logic - Pattern matching and intent detection
    const lowerMessage = message.toLowerCase();

    // Schedule a call
    if (lowerMessage.includes('schedule') || lowerMessage.includes('add a call') || lowerMessage.includes('new call')) {
      return NextResponse.json({
        message: "I'll help you schedule a call. Here's what I need:\n\n1. Client name\n2. Phone number\n3. Date and time\n4. Duration\n5. Priority (high/medium/low)\n6. Category\n7. Any notes\n\nFor example: 'Schedule a call with Sarah Johnson at +1-555-0199 tomorrow at 2 PM for 45 minutes, high priority, category Sales, discuss new contract'",
        action: null
      });
    }

    // More specific schedule request
    if (lowerMessage.match(/schedule.*with|call with/)) {
      const extracted = extractCallInfo(message);
      if (extracted.clientName) {
        const newCall = {
          clientName: extracted.clientName,
          phoneNumber: extracted.phoneNumber || '+1-555-XXXX',
          scheduledTime: extracted.scheduledTime || new Date(Date.now() + 86400000),
          duration: extracted.duration || 30,
          status: 'scheduled' as const,
          notes: extracted.notes || 'No notes provided',
          priority: extracted.priority || 'medium' as const,
          category: extracted.category || 'General'
        };

        return NextResponse.json({
          message: `✅ Call scheduled successfully!\n\nClient: ${newCall.clientName}\nPhone: ${newCall.phoneNumber}\nTime: ${new Date(newCall.scheduledTime).toLocaleString()}\nDuration: ${newCall.duration} minutes\nPriority: ${newCall.priority}\nCategory: ${newCall.category}\nNotes: ${newCall.notes}`,
          action: 'schedule_call',
          data: newCall
        });
      }
    }

    // Show upcoming calls
    if (lowerMessage.includes('show') && (lowerMessage.includes('call') || lowerMessage.includes('schedule'))) {
      const upcomingCalls = calls.filter((c: Call) => c.status === 'scheduled');
      if (upcomingCalls.length === 0) {
        return NextResponse.json({
          message: "You don't have any upcoming calls scheduled.",
          action: null
        });
      }

      const callsList = upcomingCalls.map((call: Call, idx: number) =>
        `${idx + 1}. ${call.clientName} - ${new Date(call.scheduledTime).toLocaleString()} (${call.priority} priority)`
      ).join('\n');

      return NextResponse.json({
        message: `📅 You have ${upcomingCalls.length} upcoming call(s):\n\n${callsList}`,
        action: null
      });
    }

    // High priority calls
    if (lowerMessage.includes('priority') || lowerMessage.includes('urgent') || lowerMessage.includes('important')) {
      const highPriorityCalls = calls.filter((c: Call) => c.priority === 'high');
      if (highPriorityCalls.length === 0) {
        return NextResponse.json({
          message: "You don't have any high priority calls at the moment.",
          action: null
        });
      }

      const callsList = highPriorityCalls.map((call: Call, idx: number) =>
        `${idx + 1}. ${call.clientName} - ${new Date(call.scheduledTime).toLocaleString()} [${call.status}]`
      ).join('\n');

      return NextResponse.json({
        message: `🔥 You have ${highPriorityCalls.length} high priority call(s):\n\n${callsList}`,
        action: null
      });
    }

    // Summarize/report
    if (lowerMessage.includes('summar') || lowerMessage.includes('report') || lowerMessage.includes('overview')) {
      const scheduled = calls.filter((c: Call) => c.status === 'scheduled').length;
      const completed = calls.filter((c: Call) => c.status === 'completed').length;
      const missed = calls.filter((c: Call) => c.status === 'missed').length;
      const high = calls.filter((c: Call) => c.priority === 'high').length;

      return NextResponse.json({
        message: `📊 Calls Summary:\n\n✅ Completed: ${completed}\n📅 Scheduled: ${scheduled}\n❌ Missed: ${missed}\n🔥 High Priority: ${high}\n\nTotal Calls: ${calls.length}`,
        action: null
      });
    }

    // Mark as completed
    if (lowerMessage.includes('complete') || lowerMessage.includes('finished')) {
      const firstScheduled = calls.find((c: Call) => c.status === 'scheduled');
      if (firstScheduled) {
        return NextResponse.json({
          message: `✅ Marked call with ${firstScheduled.clientName} as completed. Great job!`,
          action: 'update_call',
          data: { id: firstScheduled.id, status: 'completed' }
        });
      }
      return NextResponse.json({
        message: "No scheduled calls to mark as completed.",
        action: null
      });
    }

    // Default helpful response
    return NextResponse.json({
      message: `I can help you with:\n\n📅 Schedule new calls\n📊 View your call schedule\n✅ Mark calls as completed\n🔥 Check high priority calls\n📝 Generate summaries and reports\n\nWhat would you like to do?`,
      action: null
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { message: 'An error occurred processing your request.', action: null },
      { status: 500 }
    );
  }
}

function extractCallInfo(message: string) {
  const info: any = {};

  // Extract name (after "with")
  const nameMatch = message.match(/with\s+([A-Za-z\s]+?)(?:\s+at|\s+on|\s+tomorrow|\s+,|$)/i);
  if (nameMatch) {
    info.clientName = nameMatch[1].trim();
  }

  // Extract phone number
  const phoneMatch = message.match(/(\+?\d{1}-?\d{3}-?\d{4}|\+?\d{10,})/);
  if (phoneMatch) {
    info.phoneNumber = phoneMatch[1];
  }

  // Extract duration
  const durationMatch = message.match(/(\d+)\s*(min|minute|hour)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    info.duration = durationMatch[2].toLowerCase().startsWith('hour') ? value * 60 : value;
  }

  // Extract priority
  if (message.toLowerCase().includes('high priority')) {
    info.priority = 'high';
  } else if (message.toLowerCase().includes('low priority')) {
    info.priority = 'low';
  } else if (message.toLowerCase().includes('medium priority')) {
    info.priority = 'medium';
  }

  // Extract category
  const categoryMatch = message.match(/category\s+([A-Za-z]+)/i);
  if (categoryMatch) {
    info.category = categoryMatch[1];
  }

  // Extract notes (after "discuss" or similar)
  const notesMatch = message.match(/(?:discuss|about|regarding)\s+(.+?)(?:\s*$)/i);
  if (notesMatch) {
    info.notes = notesMatch[1].trim();
  }

  // Extract time
  if (message.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // Default to 2 PM
    info.scheduledTime = tomorrow;
  } else if (message.toLowerCase().includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);
    info.scheduledTime = nextWeek;
  }

  return info;
}
