---
layout: single
title: "Beautiful algorithms"
date: 2025-09-23 00:00:01 +02:00
author_profile: true
toc: true
toc_sticky: true
header:
    teaser: assets/stylish_algorithm.jpg
---

## Introduction

Not all algorithms are beautiful. I discovered this theorem while practicing on [Codeforces](https://codeforces.com), which has a surprisingly large number of problems involving one or multiple arrays and a very convoluted operation; the perfect recipe for racking your brains for 30 minutes before finding a not-so-satisfying (and very forgettable) solution. On the other end of the spectrum, I found some ICPC problems very interesting, which is why I wanted to create visualizations of some of them. That said, this might take some time so this page will probably get bigger as time goes on.

This idea of algorithm visualization is inspired by the [VisuAlgo website](https://visualgo.net), which I definitely recommend you go check out! I want to do something similar, so I built [my own visualizer](/visualizer/): you can generate point sets (random, circles, grids, clusters) and watch the algorithms below run step by step.

## NWERC 2009 Problem I: Simple Polygon

<object data="/assets/nwerc2009-19.pdf" width="1000" height="1000" type='application/pdf'></object>

I wanted to start with a very basic line sweep algorithm. The solution is to start from a corner (I personally go to the leftmost point and then choose the lowest one if there are multiple) and then sweep a line counterclockwise starting from the vertical line going through this corner. Each time the line hits a point, we add it to the polygon and continue until we have added all points. If you hit multiple points at the same time, you need to add the closest one first except for the points on the very last line. This construction guarantees that no two edges of the polygon intersect since every new edge will be located in a yet untouched circle sector.

Note that this algorithm doesn't work if you choose a point in the middle at first since the last property doesn't hold if the two points have an angle of more than 180° with the center.

You can watch this algorithm in action on its [visualizer page](/visualizer/simple-polygon.html)!

## Convex Hull

The construction above works very similarly to the monotone chain convex hull algorithm: you sweep from left to right, adding each point to your current hull and popping the points that would create a bad turn, which builds your upper hull; then you sweep back from right to left to get the lower hull. This one also has its own [visualizer page](/visualizer/convex-hull.html)!

I also got to study convex hulls more seriously in a second year course at École Polytechnique: with a friend, we implemented two convex hull algorithms in C++, compared their performance, and built some visualizations for them with SFML and matplotlib. The code is public on my GitHub if you are curious: [projectComputGeo](https://github.com/aparesy/projectComputGeo).