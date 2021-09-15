/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {
    useState,
    useEffect,
    useRef,
} from 'react';

import {
  StyleSheet,  
  ScrollView,
  Text,
  Button,
  View,
  ToastAndroid,
} from 'react-native';

import {Camera, useCameraDevices, useCameraFormat, useFrameProcessor} from 'react-native-vision-camera'
import Animated, {runOnJS} from 'react-native-reanimated';
import {scanSaveQRCodes, runExample1} from './frame-processors'

function FieldSpacer({size=10})
{
    return <View style={ {width:size, height:size} } />
}


function timeStamp() 
{
    'worklet';

    var now = new Date();

    let year  = String(now.getFullYear() ).padStart(2, "0");
    let month = String(now.getMonth() + 1).padStart(2, "0");
    let day   = String(now.getDate()     ).padStart(2, "0");
    let hours = String(now.getHours()    ).padStart(2, "0");
    let mins  = String(now.getMinutes()  ).padStart(2, "0");
    let secs  = String(now.getSeconds()  ).padStart(2, "0");

    return [year.slice(2), month, day].join('') + '_' + [hours, mins, secs].join('');
}

function OverlayButton(props)
{
    return <Button style={styles.overlayButton} {...props} />
}

function showToast(message)
{
    ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.CENTER);
}

function CameraView()
{
    const [hasPermission  , setHasPermission  ] = useState(false);
    const [shouldSaveFrame, setShouldSaveFrame] = useState(false);
    const [scanResult     , setScanResult     ] = useState(null);
    const [active         , setActive         ] = useState(true);

    const cameraDevices = useCameraDevices();
    const cameraDevice  = cameraDevices.back;
    const format        = useCameraFormat(cameraDevice);

    const frameProcessor = useFrameProcessor(function(frame)
    {
        'worklet';

        const timeNow = timeStamp();
        const dimensions = frame.width + "x" + frame.height;

        console.log(timeNow, "Processing Frame:", dimensions);

        const filename = shouldSaveFrame ? [timeNow, "frame", dimensions].join("_") : null;
        const result   = scanSaveQRCodes(frame, filename);

        runOnJS(setScanResult)(result);

        if (shouldSaveFrame)
        {
            runOnJS(showToast)("Captured:\n" + result.file);
            runOnJS(setShouldSaveFrame)(false);
        }            

    }, [shouldSaveFrame]);

    useEffect(function()
    {
        async function onMount()
        {
            const permission = await Camera.requestCameraPermission();
            setHasPermission(permission === 'authorized');
        }
        onMount();
    }, []);

    if (!hasPermission || !cameraDevice)
        return null;

    return (
        <>
            <Camera
                style={ StyleSheet.absoluteFill }
                device={cameraDevice}
                format={format}
                isActive={active}
                frameProcessor={active ? frameProcessor : null}
                frameProcessorFps={30}
            />            
            <ScrollView style={styles.overlayWrapper}>
                <Text style={styles.overlayText}>{JSON.stringify(scanResult, null, 2)}</Text>
            </ScrollView>
            <View style={styles.buttonSet}>
                <OverlayButton title={active ? "Pause" : "Resume"} onPress={ () => setActive(!active) } />
                <FieldSpacer />
                <OverlayButton title={shouldSaveFrame ? "Capturing..." : "Capture Frame"} onPress={ () => setShouldSaveFrame(true) } />
            </View>
        </>
    )    
}

function App()
{
  return (
    <>
        <CameraView />
    </>
  );
};

const styles = StyleSheet.create
({
    buttonSet:
    {
        position: 'absolute',
        bottom  : 10,
        left    : 10,
        right   : 10,
    },
    overlayWrapper:
    {
        padding:10,
    },
    overlayButton:
    {
        marginTop: 10,
    },
    overlayText:
    {
        color: 'yellow',
    }
})

export default App;
