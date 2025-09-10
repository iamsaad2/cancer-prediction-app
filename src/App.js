import React, { useState, useEffect } from "react";

const App = () => {
  const [cancerTypes, setCancerTypes] = useState([]);
  const [selectedCancer, setSelectedCancer] = useState("");
  const [requiredInputs, setRequiredInputs] = useState({});
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL ||
        "https://cancer-predictor-production-ae67.up.railway.app"
      : "https://cancer-predictor-production-ae67.up.railway.app";

  // Fetch available cancer types on component mount
  useEffect(() => {
    fetchCancerTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCancerTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/cancer-types`);
      const data = await response.json();
      setCancerTypes(data.cancer_types);
    } catch (err) {
      setError("Failed to fetch cancer types");
    }
  };

  // Fetch required inputs when cancer type changes
  useEffect(() => {
    if (selectedCancer) {
      fetchRequiredInputs(selectedCancer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCancer]);

  const fetchRequiredInputs = async (cancerType) => {
    try {
      const response = await fetch(`${API_BASE}/inputs/${cancerType}`);
      const data = await response.json();
      setRequiredInputs(data);
      setFormData({}); // Reset form data completely
      setPrediction(null); // Reset prediction
      setError(""); // Clear any previous errors
    } catch (err) {
      setError("Failed to fetch input requirements");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/predict/${selectedCancer}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setPrediction(data);
      }
    } catch (err) {
      setError("Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (field, description) => {
    const isNumeric = description.includes("(number)");

    // Handle each field type explicitly to avoid any option mixing
    if (field === "fuhrman_grade") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Fuhrman Grade</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      );
    }

    if (field === "sex") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      );
    }

    if (field === "surgical_factors") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Surgical Factors</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (field === "surgical_grade") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Surgical Grade</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      );
    }

    if (field === "tnm_n") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select TNM N Stage</option>
          <option value="N0">N0</option>
          <option value="N1">N1</option>
          <option value="N2">N2</option>
          <option value="N3">N3</option>
        </select>
      );
    }

    if (field === "tnm_t") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select TNM T Stage</option>
          <option value="T0">T0</option>
          <option value="T1">T1</option>
          <option value="T2">T2</option>
          <option value="T3">T3</option>
          <option value="T4">T4</option>
        </select>
      );
    }

    if (
      field === "er_status" ||
      field === "pr_status" ||
      field === "her2_status"
    ) {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">
            Select{" "}
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </option>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      );
    }

    if (field === "grade") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Grade</option>
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
          <option value="Grade 4">Grade 4</option>
        </select>
      );
    }

    if (field === "gleason") {
      return (
        <select
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Gleason Score</option>
          <option value="Grade group 1">Grade group 1</option>
          <option value="Grade group 2">Grade group 2</option>
          <option value="Grade group 3">Grade group 3</option>
          <option value="Grade group 4">Grade group 4</option>
          <option value="Grade group 5">Grade group 5</option>
        </select>
      );
    }

    // For numeric inputs
    if (isNumeric) {
      const props = { step: "0.1" };

      if (field === "age") {
        props.min = "0";
        props.max = "120";
      } else if (field === "core_ratio") {
        props.min = "0";
        props.max = "1";
        props.step = "0.01";
      } else if (field === "psa" || field === "cea") {
        props.min = "0";
      }

      return (
        <input
          type="number"
          value={formData[field] || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={`Enter ${field.replace(/_/g, " ")}`}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          {...props}
        />
      );
    }

    // Fallback for other fields - parse from description
    if (description && typeof description === "string") {
      const optionsMatch = description.match(/\(([^)]+)\)/);
      if (optionsMatch) {
        const options = optionsMatch[1].split(",").map((opt) => opt.trim());

        return (
          <select
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">
              Select{" "}
              {field
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
    }

    // Default text input
    return (
      <input
        type="text"
        value={formData[field] || ""}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={`Enter ${field.replace(/_/g, " ")}`}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
    );
  };

  const getRiskColor = (riskLevel) => {
    return riskLevel === "HIGH" ? "text-red-600" : "text-green-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Cancer Metastasis Risk Prediction
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Cancer Type</h2>
          <select
            value={selectedCancer}
            onChange={(e) => setSelectedCancer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a cancer type...</option>
            {cancerTypes.map((type) => (
              <option key={type} value={type}>
                {type === "LNSC"
                  ? "Lung Non-Small Cell Cancer"
                  : type === "LSC"
                  ? "Lung Small Cell Cancer"
                  : type.charAt(0).toUpperCase() + type.slice(1) + " Cancer"}
              </option>
            ))}
          </select>
        </div>

        {selectedCancer && Object.keys(requiredInputs).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
            <div className="space-y-4">
              {Object.entries(requiredInputs).map(([field, description]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  {renderInputField(field, description)}
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Predicting..." : "Predict Metastasis Risk"}
              </button>
            </div>
          </div>
        )}

        {prediction && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3 text-blue-600">
                  Logistic Regression
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Metastasis Probability:</span>{" "}
                    {(
                      prediction.predictions.logistic_regression.metastasis *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p>
                    <span className="font-medium">
                      No Metastasis Probability:
                    </span>{" "}
                    {(
                      prediction.predictions.logistic_regression.no_metastasis *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-lg">
                    <span className="font-medium">Risk Level: </span>
                    <span
                      className={`font-bold ${getRiskColor(
                        prediction.predictions.logistic_regression.risk_level
                      )}`}
                    >
                      {prediction.predictions.logistic_regression.risk_level}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3 text-green-600">
                  Random Forest
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Metastasis Probability:</span>{" "}
                    {(
                      prediction.predictions.random_forest.metastasis * 100
                    ).toFixed(1)}
                    %
                  </p>
                  <p>
                    <span className="font-medium">
                      No Metastasis Probability:
                    </span>{" "}
                    {(
                      prediction.predictions.random_forest.no_metastasis * 100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-lg">
                    <span className="font-medium">Risk Level: </span>
                    <span
                      className={`font-bold ${getRiskColor(
                        prediction.predictions.random_forest.risk_level
                      )}`}
                    >
                      {prediction.predictions.random_forest.risk_level}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Prediction generated at:{" "}
              {new Date(prediction.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
