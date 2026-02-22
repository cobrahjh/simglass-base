# Lovable GTN750Xi - Browser Testing Guide

**URL:** http://192.168.1.42:8080/ui/gtn750xi-react/

---

## Quick Console Test

Open browser console (F12) and run:

```javascript
// Check if React app loaded
console.log('React root:', document.getElementById('root') ? '✅' : '❌');

// Check if WebSocket is attempting to connect
// (Look for WebSocket connection in Network tab)

// Wait 2 seconds for connection, then check state in React DevTools
setTimeout(() => {
  console.log('Check React DevTools for:');
  console.log('- FlightDataContext → connectionMode (should be "websocket")');
  console.log('- GtnContext → currentPage');
  console.log('- FlightData → altitude, groundSpeed, lat, lng (should update)');
}, 2000);
```

---

## Visual Inspection

### What You Should See

**Header Bar:**
- Emergency status indicator (top-left)
- Direct-To button
- Home button (house icon)
- Smart Glide indicator (if applicable)

**Tab Navigation:**
- Horizontal tabs for all screens
- Tabs: PFD, Map, Flight Plan, Traffic, Terrain, Weather, Charts, etc.
- Active tab highlighted

**Frequency Bar (Top):**
- COM frequency display
- NAV frequency display
- XPDR code
- Clickable to open control panels

**Main Display:**
- Current screen content (default: Map or Home)
- Should show navigation map with Leaflet

**Bottom Toolbar:**
- Additional controls and status
- CDI bar (if applicable)

---

## Functional Tests

### 1. Test Screen Navigation

**Action:** Click different tabs

**Expected:**
- Map tab → Shows Leaflet map
- Flight Plan tab → Shows waypoint list
- Traffic tab → Shows traffic display
- Terrain tab → Shows terrain view

### 2. Test WebSocket Connection

**Check Network Tab (F12):**
- Look for WebSocket connection to `ws://192.168.1.42:8080`
- Status should be: `101 Switching Protocols` (connected)
- Should see messages flowing with sim data

**Check Console:**
- Should NOT see "WS error" or "WS connect failed"
- May see: "WS parse error" if format mismatch

**Server Logs (on commander-pc):**
- Should show: `[WS] Client switched to Lovable format`

### 3. Test Data Updates

**Navigate to any screen with live data:**

**Map Screen:**
- Aircraft position should update (lat/lng from sim)
- Heading should update
- Should see ownship icon moving

**Flight Plan Screen:**
- Waypoints should display
- Distances should calculate
- Active waypoint should highlight

### 4. Test Planning Utilities

**Navigate to each utility:**

**VCALC:**
- Click VCALC tab
- Should show: Target Altitude, Descent Angle, Offset inputs
- Should show: Current ALT, Dist to TOD, VS Required outputs
- Verify calculations update with sim data
- Try clicking +/- buttons to adjust target altitude

**Trip Planning:**
- Click Trip tab
- Should show Point-to-Point or Flight Plan mode
- Should calculate: DTK, DIS, ETE, ETA, ESA
- Test mode toggle

**Fuel Planning:**
- Click Fuel tab
- Should show fuel inputs: EST Fuel Remaining, Fuel Flow, Ground Speed
- Should calculate: Fuel Required, Range, Efficiency, Endurance
- Verify fuel countdown (should decrement)

**DALT/TAS:**
- Click DALT tab
- Should show inputs: Indicated ALT, BARO, CAS, TAT, HDG, TRK, GS
- Should calculate: Density ALT, TAS, Wind Direction/Speed
- Verify calculations are correct

**Checklists:**
- Click Checklists tab
- Should show checklist groups and items
- Click checkboxes → should toggle complete/incomplete
- Status should update when all items checked

---

## Expected Behavior

### If WebSocket Connected Successfully

✅ **Data Updates:**
- Altitude changes in real-time
- Ground speed updates
- Heading updates
- Position (lat/lng) updates
- All Planning utility calculations refresh

✅ **Server Logs:**
```
[WS] Client switched to Lovable format
```

✅ **Browser Console:**
- No WebSocket errors
- Connection mode: "websocket"

### If WebSocket Connection Fails

❌ **Symptoms:**
- Data shows default/mock values
- Altitude stuck at 0
- No real-time updates
- Console shows connection errors

❌ **Possible Causes:**
1. Server not restarted (adapter not loaded)
2. WebSocket URL incorrect in FlightDataContext
3. Format opt-in message not sent
4. CORS or network issue

---

## Comparison Test

**Open all three versions side-by-side:**

1. V1 (Classic): `http://192.168.1.42:8080/ui/gtn750xi/`
2. V2 (Menu Bar): `http://192.168.1.42:8080/ui/gtn750xi/?layout=v2`
3. React (Lovable): `http://192.168.1.42:8080/ui/gtn750xi-react/`

**Verify:**
- All three receive same sim data
- Altitude matches across all three
- Ground speed matches
- Planning utility calculations match

---

## Troubleshooting

### React App Shows Blank Screen

1. Check browser console for errors
2. Verify assets loaded (Network tab)
3. Check if `<div id="root">` is populated
4. Try hard refresh (Ctrl+Shift+R)

### WebSocket Won't Connect

1. Verify server is running: `curl http://192.168.1.42:8080/api/health`
2. Check server was restarted (adapter must be loaded)
3. Verify WebSocket URL in FlightDataContext.tsx: `ws://192.168.1.42:8080`
4. Check browser console for specific error message

### Data Not Updating

1. Check WebSocket is connected (Network tab)
2. Verify SimConnect is connected: `http://192.168.1.42:8080/api/status`
3. Check server logs for format opt-in message
4. Verify adapter is transforming data (check server.js has LovableWSAdapter require)

### Planning Utilities Show Wrong Values

1. Compare with V1/V2 vanilla versions
2. Check calculation formulas in Lovable screens vs our pages
3. Verify data mapping in adapter (flightData.altitude, fuel.current, etc.)
4. Check browser console for calculation errors

---

## Success Criteria

Lovable GTN750Xi passes if:
- ✅ App loads with React UI
- ✅ WebSocket connects to server
- ✅ Server logs show "Client switched to Lovable format"
- ✅ Live sim data updates in real-time
- ✅ All screens are accessible via tabs
- ✅ Planning utilities calculate correctly
- ✅ Calculations match V1/V2 vanilla versions
- ✅ No console errors
- ✅ Professional UI renders correctly

---

**Open the Lovable UI and run through these tests!**

`http://192.168.1.42:8080/ui/gtn750xi-react/`
