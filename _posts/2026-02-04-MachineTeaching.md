---
layout: single
title: "On machine learning to teach"
date: 2026-02-04 00:00:01 +02:00
author_profile: true
toc: true
toc_sticky: true
header:
    image: assets/domain2.png
---


With a group of friends and a researcher from INRIA, we are currently working on a year-long project to build tools in order to enable intelligent teaching. The official title for the project is "An intelligent assistant for teaching programming" because we decided to work in particular in the scope of programmation (that's where the largest datasets are) but really our idea is to make something that can be generalized to all fields.

## First paper

We recently submitted a paper to a large conference, namely AIED, and to be honest I am taken aback by how suddenly this happened. As we submitted our middle-of-the-year report to Polytechnique, our tutor talked to us about a great idea he had for a paper and how we could help him to submit this to the conference that was basically two weeks away. The paper is about using Tabular Foundation Models (TFMs like TabPFN) to knowledge tracing, since we found that TabPFN managed to get a really high prection rate on the ASSISTments dataset. The way this works is that we process our datasets so that the model only has to predict a 0 or a 1 depending on if the student solved a particular problem or not. The really neat thing is that TabPFN doesn't need any prior training (PFN stands for Prior Fitted Network), as opposed to traditional approaches like DKT or AKT.

This also got me to understand a lot of concepts in machine learning and how we scientists really "do" machine learning, so I'm really happy about how that went.

## On TabPFN

Since TabPFN really is a big black box (it was trained for days on synthetic data), I have experimented with my own version using [nanoTabPFN](https://github.com/automl/nanoTabPFN) which I reimplemented by hand.

![Diagram in the nanoTabPFN article](/assets/tabpfn.png)

(To be continued)