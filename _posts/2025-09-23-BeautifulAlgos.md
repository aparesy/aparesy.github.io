---
layout: single
title: "Beautiful algorithms"
date: 2025-09-23 00:00:01 +02:00
author_profile: true
toc: true
toc_sticky: true
---

## Introduction

Not all algorithms are beautiful. I discovered this theorem while practicing on [codeforces](codeforces.com), which has a surprisingly large amount of problems involving one or multiple array and a very convoluted operation ; the perfect recipe for racking your brains during 30 minutes before finding a not-so-satisfying (and very forgettable) solution. On the other end of the spectrum, I found some ICPC problems very interesting which is why I wanted to create visualations of some of them. That said, this might take some time so this page will probably get bigger as time goes on.

This idea of algorithm visualization is inspired by the [VisuAlgo website](visualgo.net), which I definitely recommend you go check out ! I want to do something similar so I'm working on a visualizer for the problems here

## NWERC 2009 Problem I : Simple Polygon

<object data="/assets/nwerc2009-19.pdf" width="1000" height="1000" type='application/pdf'></object>

I wanted to start with a very basic line sweep algorithm. The solution is to start from a corner (I personally go to the leftmost point and then choose the lowest one if there are multiple) and then sweep a line counterclockwise starting from the vertical line going through this corner. Each time the line hits a point, we add it to the polygon and continue until we have added all points. If you hit multiple points at the same time, you need to add the closest one first except for the points on the very last line. This construction guarantees that no two edges of the polygon intersect since every new edge will be located in a yet untouched circle sector.

Note that this algorithm doesn't work if you choose a point in the middle at first since the last property doesn't hold if the two points have an angle of more than 180° with the center.

Note also that this works very similarly to the convex hull algorithm where you go sweep from left to right, progressively remove points and add points from your current hull, and then this creates your upper hull so you just sweep back from right to left to get the lower hull.