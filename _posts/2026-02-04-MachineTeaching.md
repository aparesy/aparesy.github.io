---
layout: single
title: "On machine learning to teach"
date: 2026-02-04 00:00:01 +02:00
author_profile: true
toc: true
toc_sticky: true
header:
    image: assets/domain2.png
    teaser: assets/design_ml.jpg
---


With a group of friends and a researcher from INRIA, we worked on a year-long project to build tools that enable intelligent teaching. The official title for the project is "An intelligent assistant for teaching programming" because we decided to work in particular in the scope of programming (that's where the largest datasets are) but really our idea is to make something that can be generalized to all fields.

## First paper

We recently submitted a paper to a large conference, namely AIED, and to be honest I am taken aback by how suddenly this happened. As we submitted our middle-of-the-year report to Polytechnique, our tutor talked to us about a great idea he had for a paper and how we could help him to submit this to the conference that was basically two weeks away. The paper is about applying Tabular Foundation Models (TFMs like TabPFN) to knowledge tracing, since we found that TabPFN managed to get a really high prediction rate on the ASSISTments dataset. The way this works is that we process our datasets so that the model only has to predict a 0 or a 1 depending on if the student solved a particular problem or not. The really neat thing is that TabPFN doesn't need any prior training (PFN stands for Prior-Data Fitted Network), as opposed to traditional approaches like DKT or AKT.

This also got me to understand a lot of concepts in machine learning and how we scientists really "do" machine learning, so I'm really happy about how that went.

**Update (July 2026):** the paper was accepted at AIED 2026, and we presented it at the onsite poster session! You can [read it on arXiv](https://arxiv.org/abs/2602.06542).

## On TFMs

One interesting thing is that TabPFN doesn't just output a single number for each prediction, it approximates a full Bayesian posterior predictive distribution. For classification this just means a probability for each class, but for regression this is a lot more interesting: instead of predicting one value, the model outputs a whole distribution over possible values, represented internally as a piecewise-constant function over a range of buckets. This lets it express things a plain point estimate cannot, like a prediction being genuinely uncertain, or even multi-modal, if the training data suggests several very different outcomes are plausible given the same input. In our case, this maps nicely onto knowledge tracing, since predicting whether a student solves a problem is inherently a probability, not a hard yes or no, and having the model reason in terms of a distribution from the start rather than bolting on a probability estimate afterward feels like the right way to do it.

![Diagram of a tabular foundation model processing a dataset in-context](/assets/tabpfn.png)

In our paper, we tried using both TabPFN and TabICL, but it seems like these models are on the rise so it is probable that moreof them will appear soon.